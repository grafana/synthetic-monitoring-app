package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

// queryAction is the permission a user needs on a datasource to query it.
const queryAction = "datasources:query"

// authorizer answers "is this user allowed to query this datasource?" by asking
// Grafana, rather than by reimplementing Grafana's access control.
//
// This is what stops the backend being a privilege-escalation hole. Without it the
// plugin queries with its own service account, so any user who can reach the app
// could read data through it that they have no permission to query directly.
//
// Label-based access control needs no special handling: the label policy travels
// with the target datasource's own token and is applied when Grafana runs the
// query. Verifying "this user may query datasource D" and then querying D
// therefore returns exactly what the user would have got querying D themselves.
type authorizer struct {
	http *http.Client
}

func newAuthorizer(client *http.Client) *authorizer {
	return &authorizer{http: client}
}

// userLookupResponse is the part of GET /api/org/users/lookup we need. The
// endpoint filters by a free-text query and returns a list, so the exact login
// still has to be matched from the results.
type userLookupResponse []struct {
	UserID int64  `json:"userId"`
	Login  string `json:"login"`
}

// serviceAccountSearchResponse is the part of GET /api/serviceaccounts/search we
// need. Service accounts are not returned by the org users lookup, so callers
// that are service accounts have to be resolved separately.
type serviceAccountSearchResponse struct {
	ServiceAccounts []struct {
		ID    int64  `json:"id"`
		Login string `json:"login"`
	} `json:"serviceAccounts"`
}

// permissionsSearchResponse maps identity -> action -> scopes.
type permissionsSearchResponse map[string]map[string][]string

// authorize reports an error unless the request's user may query the datasource.
//
// Fails closed: any inability to establish permission -- no user on the request,
// no plugin credential, a lookup failure -- denies the query. Falling back to the
// plugin's own identity is what we are trying to avoid.
func (a *authorizer) authorize(ctx context.Context, appURL, token string, user *backend.User, ds linkedDatasource) error {
	if token == "" {
		return fmt.Errorf("this plugin has no service account credential, so it cannot verify permissions; " +
			"check that managed service accounts and the externalServiceAccounts feature are enabled")
	}

	if user == nil || user.Login == "" {
		return fmt.Errorf("no user on the request, so permission to query %s cannot be established", ds.UID)
	}

	identity, err := a.lookupIdentity(ctx, appURL, token, user.Login)
	if err != nil {
		return err
	}

	allowed, err := a.canQuery(ctx, appURL, token, identity, ds.UID)
	if err != nil {
		return err
	}

	if !allowed {
		return fmt.Errorf("%s is not allowed to query the %s datasource", user.Login, ds.Type)
	}

	return nil
}

// lookupIdentity resolves a login to the typed identifier the permissions API
// expects -- `user:3` or `service-account:7`.
//
// Two lookups are needed because the caller may be either. The org users lookup
// does not return service accounts, so a service account token would otherwise be
// refused for the wrong reason: not "you may not query this" but "I could not
// work out who you are".
func (a *authorizer) lookupIdentity(ctx context.Context, appURL, token, login string) (string, error) {
	userID, err := a.lookupUserID(ctx, appURL, token, login)
	if err != nil {
		return "", err
	}
	if userID != 0 {
		return fmt.Sprintf("user:%d", userID), nil
	}

	serviceAccountID, err := a.lookupServiceAccountID(ctx, appURL, token, login)
	if err != nil {
		return "", err
	}
	if serviceAccountID != 0 {
		return fmt.Sprintf("service-account:%d", serviceAccountID), nil
	}

	return "", fmt.Errorf("could not resolve an identity for %q", login)
}

// lookupUserID returns the id of the user with exactly this login, or 0 if there
// is none. A missing user is not an error here -- it may be a service account.
func (a *authorizer) lookupUserID(ctx context.Context, appURL, token, login string) (int64, error) {
	endpoint := appURL + "/api/org/users/lookup?query=" + url.QueryEscape(login)

	var out userLookupResponse
	if err := a.get(ctx, endpoint, token, &out); err != nil {
		return 0, fmt.Errorf("looking up user %q: %w", login, err)
	}

	// The query is a substring match, so require an exact login rather than
	// accepting whichever user happened to sort first.
	for _, candidate := range out {
		if candidate.Login == login && candidate.UserID != 0 {
			return candidate.UserID, nil
		}
	}

	return 0, nil
}

// lookupServiceAccountID returns the id of the service account with exactly this
// login, or 0 if there is none.
func (a *authorizer) lookupServiceAccountID(ctx context.Context, appURL, token, login string) (int64, error) {
	endpoint := appURL + "/api/serviceaccounts/search?query=" + url.QueryEscape(login)

	var out serviceAccountSearchResponse
	if err := a.get(ctx, endpoint, token, &out); err != nil {
		return 0, fmt.Errorf("looking up service account %q: %w", login, err)
	}

	// also a substring match, so match the login exactly
	for _, candidate := range out.ServiceAccounts {
		if candidate.Login == login && candidate.ID != 0 {
			return candidate.ID, nil
		}
	}

	return 0, nil
}

func (a *authorizer) canQuery(ctx context.Context, appURL, token, identity, dsUID string) (bool, error) {
	params := url.Values{}
	params.Set("namespacedId", identity)
	params.Set("action", queryAction)

	endpoint := appURL + "/api/access-control/users/permissions/search?" + params.Encode()

	var out permissionsSearchResponse
	if err := a.get(ctx, endpoint, token, &out); err != nil {
		return false, fmt.Errorf("checking permissions: %w", err)
	}

	// Grafana keys the result by the identity it resolved, which is not necessarily
	// spelled the way we asked, so accept a match under any identity.
	for _, actions := range out {
		for _, scope := range actions[queryAction] {
			if scopeCoversDatasource(scope, dsUID) {
				return true, nil
			}
		}
	}

	return false, nil
}

// scopeCoversDatasource reports whether an RBAC scope grants access to the given
// datasource. Wildcards are what a user with blanket datasource access gets.
func scopeCoversDatasource(scope, dsUID string) bool {
	switch scope {
	case "*", "datasources:*", "datasources:uid:*":
		return true
	}

	return scope == "datasources:uid:"+dsUID
}

func (a *authorizer) get(ctx context.Context, endpoint, token string, into any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := a.http.Do(req)
	if err != nil {
		return err
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("%s returned %s", endpoint, resp.Status)
	}

	return json.NewDecoder(resp.Body).Decode(into)
}
