package plugin

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// The payloads below were captured from a running Grafana, so the parsing is
// tested against the real response shapes rather than assumed ones:
//
//	GET /api/org/users/lookup?query=admin
//	  [{"userId":1,"uid":"bftoov3dms4jkf","login":"admin","avatarUrl":"/avatar/46d2..."}]
//	GET /api/access-control/users/permissions/search?namespacedId=user:1&action=datasources:query
//	  {"1":{"datasources:query":["datasources:*"]}}
//	  ... and for a user with the None basic role:
//	  {"5":{}}
const (
	lookupAdmin   = `[{"userId":1,"uid":"bftoov3dms4jkf","login":"admin","avatarUrl":"/avatar/46d2"}]`
	lookupNoUsers = `[]`
	// GET /api/serviceaccounts/search?query=sa-1-test.
	searchServiceAccount = `{"totalCount":1,"serviceAccounts":[{"id":7,"login":"sa-1-test","role":"None"}],"page":1,"perPage":50}`
	searchNoServiceAccts = `{"totalCount":0,"serviceAccounts":[],"page":1,"perPage":50}`
	// keyed by the resolved identity, which for a service account is its numeric id.
	permissionsForSA     = `{"7":{"datasources:query":["datasources:uid:PDAA01AED1D8AE0F9"]}}`
	permissionsWildcard  = `{"1":{"datasources:query":["datasources:*"]}}`
	permissionsNone      = `{"5":{}}`
	permissionsSpecific  = `{"1":{"datasources:query":["datasources:uid:PDAA01AED1D8AE0F9"]}}`
	permissionsSpecOther = `{"1":{"datasources:query":["datasources:uid:some-other-datasource"]}}`
)

const promUID = "PDAA01AED1D8AE0F9"

// fakeGrafana serves the endpoints the authorizer depends on. serviceAccounts may
// be empty for the common case where the caller is a user.
func fakeGrafana(t *testing.T, lookup, permissions string, serviceAccounts ...string) *httptest.Server {
	t.Helper()

	saBody := searchNoServiceAccts
	if len(serviceAccounts) > 0 {
		saBody = serviceAccounts[0]
	}

	// record which identity the permission check was asked about
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer plugin-token" {
			t.Errorf("missing or wrong plugin credential: %q", got)
		}

		w.Header().Set("Content-Type", "application/json")

		switch {
		case strings.HasPrefix(r.URL.Path, "/api/org/users/lookup"):
			_, _ = w.Write([]byte(lookup))
		case strings.HasPrefix(r.URL.Path, "/api/serviceaccounts/search"):
			_, _ = w.Write([]byte(saBody))
		case strings.HasPrefix(r.URL.Path, "/api/access-control/users/permissions/search"):
			_, _ = w.Write([]byte(permissions))
		default:
			t.Errorf("unexpected request to %s", r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
}

func TestAuthorize(t *testing.T) {
	prom := linkedDatasource{UID: promUID, Type: "prometheus"}

	tests := []struct {
		name        string
		user        *backend.User
		token       string
		lookup      string
		permissions string
		wantErr     string
	}{
		{
			name:        "allowed by a wildcard scope",
			user:        &backend.User{Login: "admin"},
			token:       "plugin-token",
			lookup:      lookupAdmin,
			permissions: permissionsWildcard,
		},
		{
			name:        "allowed by an exact datasource scope",
			user:        &backend.User{Login: "admin"},
			token:       "plugin-token",
			lookup:      lookupAdmin,
			permissions: permissionsSpecific,
		},
		{
			name:        "denied when the user has no permissions at all",
			user:        &backend.User{Login: "admin"},
			token:       "plugin-token",
			lookup:      lookupAdmin,
			permissions: permissionsNone,
			wantErr:     "not allowed to query",
		},
		{
			name:        "denied when the permission is for a different datasource",
			user:        &backend.User{Login: "admin"},
			token:       "plugin-token",
			lookup:      lookupAdmin,
			permissions: permissionsSpecOther,
			wantErr:     "not allowed to query",
		},
		{
			// fails closed: without a credential the plugin cannot ask, so it must
			// refuse rather than fall back to its own identity
			name:        "denied when the plugin has no credential",
			user:        &backend.User{Login: "admin"},
			token:       "",
			lookup:      lookupAdmin,
			permissions: permissionsWildcard,
			wantErr:     "no service account credential",
		},
		{
			name:        "denied when there is no user on the request",
			user:        nil,
			token:       "plugin-token",
			lookup:      lookupAdmin,
			permissions: permissionsWildcard,
			wantErr:     "no user on the request",
		},
		{
			name:        "denied when the login matches neither a user nor a service account",
			user:        &backend.User{Login: "admin-impostor"},
			token:       "plugin-token",
			lookup:      lookupAdmin,
			permissions: permissionsWildcard,
			wantErr:     "could not resolve an identity",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv := fakeGrafana(t, tt.lookup, tt.permissions)
			defer srv.Close()

			a := newAuthorizer(srv.Client())
			err := a.authorize(t.Context(), srv.URL, tt.token, tt.user, prom)

			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("expected the query to be allowed, got: %v", err)
				}

				return
			}

			if err == nil {
				t.Fatalf("expected denial containing %q, got nil", tt.wantErr)
			}

			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("error = %q, want it to contain %q", err, tt.wantErr)
			}
		})
	}
}

func TestScopeCoversDatasource(t *testing.T) {
	tests := []struct {
		scope string
		want  bool
	}{
		{"*", true},
		{"datasources:*", true},
		{"datasources:uid:*", true},
		{"datasources:uid:" + promUID, true},
		{"datasources:uid:something-else", false},
		{"datasources:read", false},
		{"", false},
	}

	for _, tt := range tests {
		if got := scopeCoversDatasource(tt.scope, promUID); got != tt.want {
			t.Errorf("scopeCoversDatasource(%q) = %v, want %v", tt.scope, got, tt.want)
		}
	}
}

// A lookup substring match must not be mistaken for an identity match: querying
// "admin" also returns "administrator", and picking the wrong one would authorize
// against the wrong user's permissions.
func TestLookupRequiresExactLogin(t *testing.T) {
	const twoUsers = `[{"userId":7,"login":"administrator"},{"userId":1,"login":"admin"}]`

	srv := fakeGrafana(t, twoUsers, permissionsWildcard)
	defer srv.Close()

	a := newAuthorizer(srv.Client())

	id, err := a.lookupUserID(t.Context(), srv.URL, "plugin-token", "admin")
	if err != nil {
		t.Fatalf("lookupUserID: %v", err)
	}

	if id != 1 {
		t.Errorf("resolved user id = %d, want 1 (admin), not the substring match", id)
	}
}

// A service-account caller is resolved through a different endpoint: the org users
// lookup does not return service accounts, so without this a service account token
// is refused for the wrong reason -- "I cannot tell who you are" rather than "you
// may not query this".
func TestAuthorizeServiceAccountCaller(t *testing.T) {
	prom := linkedDatasource{UID: promUID, Type: "prometheus"}

	var askedAbout string

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch {
		case strings.HasPrefix(r.URL.Path, "/api/org/users/lookup"):
			_, _ = w.Write([]byte(lookupNoUsers))
		case strings.HasPrefix(r.URL.Path, "/api/serviceaccounts/search"):
			_, _ = w.Write([]byte(searchServiceAccount))
		case strings.HasPrefix(r.URL.Path, "/api/access-control/users/permissions/search"):
			askedAbout = r.URL.Query().Get("namespacedId")
			_, _ = w.Write([]byte(permissionsForSA))
		default:
			t.Errorf("unexpected request to %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	a := newAuthorizer(srv.Client())

	if err := a.authorize(t.Context(), srv.URL, "plugin-token",
		&backend.User{Login: "sa-1-test"}, prom); err != nil {
		t.Fatalf("a service account with the permission should be allowed: %v", err)
	}

	if askedAbout != "service-account:7" {
		t.Errorf("permissions were checked for %q, want service-account:7", askedAbout)
	}
}

func TestAuthorizeServiceAccountWithoutPermission(t *testing.T) {
	prom := linkedDatasource{UID: promUID, Type: "prometheus"}

	srv := fakeGrafana(t, lookupNoUsers, `{"7":{}}`, searchServiceAccount)
	defer srv.Close()

	a := newAuthorizer(srv.Client())

	err := a.authorize(t.Context(), srv.URL, "plugin-token", &backend.User{Login: "sa-1-test"}, prom)
	if err == nil || !strings.Contains(err.Error(), "not allowed to query") {
		t.Fatalf("expected a permission denial, got: %v", err)
	}
}
