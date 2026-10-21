package plugin

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/config"
)

// Alert rules evaluate as grafana_scheduler, which no account backs. ngalert
// sends the rule's uid with the query, and the rule records who last edited it,
// so that editor's permissions decide.
//
// Payloads captured from Grafana 13.1.1:
//
//	GET /api/ruler/grafana/api/v1/rule/aop-pp-probe-offline
//	  {"grafana_alert":{"uid":"aop-pp-probe-offline","updated_by":{"uid":"ag18u61paeo74e","name":"art-of-possible-demo"},...},...}
//	GET /api/access-control/users/permissions/search?namespacedId=user:ag18u61paeo74e&action=datasources:query
//	  {"7":{"datasources:query":["datasources:*"]}}   (a service account uid resolves as user:<uid> too)
//	GET ...?namespacedId=user:doesnotexist
//	  400 user not found
const (
	ruleEditedBySA   = `{"grafana_alert":{"uid":"r1","updated_by":{"uid":"ag18u61paeo74e","name":"art-of-possible-demo"}}}`
	ruleNoEditor     = `{"grafana_alert":{"uid":"r1","updated_by":null}}`
	permissionsForR1 = `{"7":{"datasources:query":["datasources:uid:PDAA01AED1D8AE0F9"]}}`
)

var schedulerUser = &backend.User{Login: alertSchedulerLogin, Role: "Admin"}

type ruleFake struct {
	rule        string // ruler response; empty means 404
	permissions string // permissions response; empty means 400 user not found

	askedRule     string
	askedIdentity string
}

func (f *ruleFake) serve(t *testing.T) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer plugin-token" {
			t.Errorf("missing or wrong plugin credential: %q", got)
		}

		w.Header().Set("Content-Type", "application/json")

		switch {
		case strings.HasPrefix(r.URL.Path, "/api/ruler/grafana/api/v1/rule/"):
			f.askedRule = strings.TrimPrefix(r.URL.Path, "/api/ruler/grafana/api/v1/rule/")
			if f.rule == "" {
				w.WriteHeader(http.StatusNotFound)
				return
			}

			_, _ = w.Write([]byte(f.rule))
		case strings.HasPrefix(r.URL.Path, "/api/access-control/users/permissions/search"):
			f.askedIdentity = r.URL.Query().Get("namespacedId")
			if f.permissions == "" {
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`{"message":"user not found"}`))

				return
			}

			_, _ = w.Write([]byte(f.permissions))
		case strings.HasPrefix(r.URL.Path, "/api/org/users/lookup"):
			_, _ = w.Write([]byte(lookupNoUsers))
		case strings.HasPrefix(r.URL.Path, "/api/serviceaccounts/search"):
			_, _ = w.Write([]byte(searchNoServiceAccts))
		case r.URL.Path == "/api/ds/query":
			_, _ = w.Write([]byte(`{"results":{"A":{"frames":[]}}}`))
		default:
			t.Errorf("unexpected request to %s", r.URL.Path)
			w.WriteHeader(http.StatusNotFound)
		}
	}))
}

func TestAuthorizeAlertRuleUsesItsLastEditor(t *testing.T) {
	prom := linkedDatasource{UID: promUID, Type: "prometheus"}

	t.Run("allowed when the rule's last editor may query the datasource", func(t *testing.T) {
		f := &ruleFake{rule: ruleEditedBySA, permissions: permissionsForR1}

		srv := f.serve(t)
		defer srv.Close()

		err := newAuthorizer(srv.Client()).authorize(withAlertRule(t.Context(), "r1"), srv.URL, "plugin-token", schedulerUser, prom)
		if err != nil {
			t.Fatalf("expected the query to be allowed, got: %v", err)
		}

		if f.askedRule != "r1" || f.askedIdentity != "user:ag18u61paeo74e" {
			t.Errorf("asked about rule %q as %q, want rule r1 as user:ag18u61paeo74e", f.askedRule, f.askedIdentity)
		}
	})

	tests := []struct {
		name    string
		ruleUID string
		fake    ruleFake
		wantErr string
	}{
		{
			name:    "denied when the last editor may not query the datasource",
			ruleUID: "r1",
			fake:    ruleFake{rule: ruleEditedBySA, permissions: permissionsNone},
			wantErr: `rule r1 was last edited by "art-of-possible-demo", who is not allowed to query the prometheus datasource`,
		},
		{
			name:    "denied when the last editor no longer exists",
			ruleUID: "r1",
			fake:    ruleFake{rule: ruleEditedBySA},
			wantErr: "checking permissions",
		},
		{
			// e.g. file-provisioned rules
			name:    "denied when the rule records no editor",
			ruleUID: "r1",
			fake:    ruleFake{rule: ruleNoEditor},
			wantErr: "rule r1 records no editor",
		},
		{
			name:    "denied when the rule cannot be read",
			ruleUID: "r1",
			fake:    ruleFake{},
			wantErr: "reading alert rule r1",
		},
		{
			name:    "denied when evaluation names no rule",
			ruleUID: "",
			fake:    ruleFake{rule: ruleEditedBySA, permissions: permissionsWildcard},
			wantErr: "could not resolve an identity",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			srv := tt.fake.serve(t)
			defer srv.Close()

			err := newAuthorizer(srv.Client()).authorize(withAlertRule(t.Context(), tt.ruleUID), srv.URL, "plugin-token", schedulerUser, prom)
			if err == nil {
				t.Fatalf("expected denial containing %q, got nil", tt.wantErr)
			}

			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Errorf("error = %q, want it to contain %q", err, tt.wantErr)
			}
		})
	}
}

// A logged-in user can send X-Rule-Uid themselves, and Grafana forwards it
// (verified: a browser session's `X-Rule-Uid: spoofed` reached the plugin). It
// must not let them borrow a rule editor's permissions.
func TestAuthorizeIgnoresRuleUIDFromARealUser(t *testing.T) {
	prom := linkedDatasource{UID: promUID, Type: "prometheus"}

	srv := fakeGrafana(t, lookupAdmin, permissionsNone)
	defer srv.Close()

	err := newAuthorizer(srv.Client()).authorize(withAlertRule(t.Context(), "r1"), srv.URL, "plugin-token", &backend.User{Login: "admin"}, prom)
	if err == nil || !strings.Contains(err.Error(), "admin is not allowed to query") {
		t.Fatalf("expected the user's own denial, got: %v", err)
	}
}

// QueryData must hand ngalert's X-Rule-Uid header to the authorizer. The SDK
// keeps forwarded HTTP headers under an http_ prefix, which GetHTTPHeader strips.
func TestQueryDataAuthorizesAlertEvaluationByRule(t *testing.T) {
	f := &ruleFake{rule: ruleEditedBySA, permissions: permissionsForR1}

	srv := f.serve(t)
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: promUID, Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	from := time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC)

	resp, err := ds.QueryData(ctx, &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: schedulerUser},
		Headers:       map[string]string{"http_X-Rule-Uid": "r1"},
		Queries: []backend.DataQuery{{
			RefID: "A", QueryType: queryChecksReachability, JSON: json.RawMessage(`{}`),
			TimeRange: backend.TimeRange{From: from, To: from.Add(time.Hour)},
		}},
	})
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Error != nil {
		t.Fatalf("expected the rule's query to be allowed, got: %v", resp.Responses["A"].Error)
	}

	if f.askedRule != "r1" {
		t.Errorf("asked the ruler about %q, want r1", f.askedRule)
	}
}
