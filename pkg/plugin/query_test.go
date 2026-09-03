package plugin

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/config"
)

// capturedDsQuery is one recorded call to the fake Grafana's /api/ds/query.
type capturedDsQuery struct {
	from   string
	to     string
	refIDs []string
}

// fakeGrafanaForQueryData serves the endpoints QueryData depends on:
// authorization (a wildcard-permissioned user called "tester") and
// /api/ds/query itself, recording each call it receives into *calls.
func fakeGrafanaForQueryData(t *testing.T, calls *[]capturedDsQuery) *httptest.Server {
	t.Helper()

	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch {
		case strings.HasPrefix(r.URL.Path, "/api/org/users/lookup"):
			_, _ = w.Write([]byte(`[{"userId":1,"login":"tester"}]`))
		case strings.HasPrefix(r.URL.Path, "/api/access-control/users/permissions/search"):
			_, _ = w.Write([]byte(`{"1":{"datasources:query":["datasources:*"]}}`))
		case r.URL.Path == "/api/ds/query":
			var body dsQueryRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatalf("decoding /api/ds/query body: %v", err)
			}

			var refIDs []string

			results := map[string]any{}

			for _, q := range body.Queries {
				refIDs = append(refIDs, q.RefID)
				results[q.RefID] = map[string]any{"frames": []any{}}
			}

			*calls = append(*calls, capturedDsQuery{from: body.From, to: body.To, refIDs: refIDs})
			_ = json.NewEncoder(w).Encode(map[string]any{"results": results})
		default:
			t.Errorf("unexpected request to %s", r.URL.Path)
		}
	}))
}

// TestQueryDataAppliesEachQueryOwnTimeRange reproduces the scenario found in
// code review: two named queries in one request resolve to the *same* backing
// datasource but ask for *different* time ranges (a panel-level time-range
// override, or Explore's compare mode, both send exactly this shape). Grouping
// by datasource alone loses all but one of those ranges, since /api/ds/query
// takes a single shared from/to per request -- whichever query is grouped last
// silently wins, and every other query in the group gets its answer computed
// over the wrong window instead of an error.
func TestQueryDataAppliesEachQueryOwnTimeRange(t *testing.T) {
	var calls []capturedDsQuery

	srv := fakeGrafanaForQueryData(t, &calls)
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	aFrom := time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC)
	bFrom := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: &backend.User{Login: "tester"}},
		Queries: []backend.DataQuery{
			{
				RefID: "A", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: aFrom, To: aFrom.Add(time.Hour)},
			},
			{
				RefID: "B", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: bFrom, To: bFrom.Add(time.Hour)},
			},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Error != nil {
		t.Fatalf("query A returned an error: %v", resp.Responses["A"].Error)
	}

	if resp.Responses["B"].Error != nil {
		t.Fatalf("query B returned an error: %v", resp.Responses["B"].Error)
	}

	wantAFrom := strconv.FormatInt(aFrom.UnixMilli(), 10)
	wantBFrom := strconv.FormatInt(bFrom.UnixMilli(), 10)

	// Map each RefID to the "from" actually sent to /api/ds/query in the call
	// that carried it, regardless of how many calls were made or how queries
	// were grouped across them.
	gotFrom := map[string]string{}

	for _, call := range calls {
		for _, refID := range call.refIDs {
			gotFrom[refID] = call.from
		}
	}

	if gotFrom["A"] != wantAFrom {
		t.Errorf("query A: /api/ds/query received from=%s, want %s (A's own time range) -- "+
			"grouping by datasource alone let another query's range overwrite it", gotFrom["A"], wantAFrom)
	}

	if gotFrom["B"] != wantBFrom {
		t.Errorf("query B: /api/ds/query received from=%s, want %s", gotFrom["B"], wantBFrom)
	}
}

// TestQueryDataBatchesSameDatasourceAndTimeRange is the positive counterpart to
// TestQueryDataAppliesEachQueryOwnTimeRange: two queries that share both a
// datasource and a time range should still cost one /api/ds/query round trip,
// not two. Grouping by (datasource, time range) instead of datasource alone --
// the fix for the bug above -- must not regress this into a call per query.
func TestQueryDataBatchesSameDatasourceAndTimeRange(t *testing.T) {
	var calls []capturedDsQuery

	srv := fakeGrafanaForQueryData(t, &calls)
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	tr := backend.TimeRange{
		From: time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC),
		To:   time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC),
	}

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: &backend.User{Login: "tester"}},
		Queries: []backend.DataQuery{
			{RefID: "A", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`), TimeRange: tr},
			{RefID: "B", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`), TimeRange: tr},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Error != nil {
		t.Fatalf("query A returned an error: %v", resp.Responses["A"].Error)
	}

	if resp.Responses["B"].Error != nil {
		t.Fatalf("query B returned an error: %v", resp.Responses["B"].Error)
	}

	if len(calls) != 1 {
		t.Fatalf("made %d calls to /api/ds/query, want 1 -- A and B share a datasource and time range and should batch",
			len(calls))
	}

	if got := calls[0].refIDs; len(got) != 2 {
		t.Errorf("the single call carried refIDs %v, want both A and B", got)
	}
}

// TestQueryDataCachesAuthorizationPerDatasource confirms that two query groups
// sharing a datasource but not a time range -- which the fix above deliberately
// keeps as separate /api/ds/query calls -- do not also cost two permission
// checks. authorize() depends only on the datasource, not the time range, so
// the second group should reuse the first group's decision.
func TestQueryDataCachesAuthorizationPerDatasource(t *testing.T) {
	var permissionChecks int

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch {
		case strings.HasPrefix(r.URL.Path, "/api/org/users/lookup"):
			_, _ = w.Write([]byte(`[{"userId":1,"login":"tester"}]`))
		case strings.HasPrefix(r.URL.Path, "/api/access-control/users/permissions/search"):
			permissionChecks++
			_, _ = w.Write([]byte(`{"1":{"datasources:query":["datasources:*"]}}`))
		case r.URL.Path == "/api/ds/query":
			var body dsQueryRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatalf("decoding /api/ds/query body: %v", err)
			}

			results := map[string]any{}
			for _, q := range body.Queries {
				results[q.RefID] = map[string]any{"frames": []any{}}
			}

			_ = json.NewEncoder(w).Encode(map[string]any{"results": results})
		default:
			t.Errorf("unexpected request to %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	aFrom := time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC)
	bFrom := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: &backend.User{Login: "tester"}},
		Queries: []backend.DataQuery{
			{
				RefID: "A", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: aFrom, To: aFrom.Add(time.Hour)},
			},
			{
				RefID: "B", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: bFrom, To: bFrom.Add(time.Hour)},
			},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Error != nil {
		t.Fatalf("query A returned an error: %v", resp.Responses["A"].Error)
	}

	if resp.Responses["B"].Error != nil {
		t.Fatalf("query B returned an error: %v", resp.Responses["B"].Error)
	}

	if permissionChecks != 1 {
		t.Errorf("made %d permission checks, want 1 -- A and B target the same datasource "+
			"and should share one authorization decision even though they land in different time-range groups",
			permissionChecks)
	}
}

// TestQueryDataDeniesWithoutQueryingWhenNoUser confirms the deny-before-query
// ordering, not just that authorize() itself returns an error (authz_test.go
// already covers that at the unit level). A bug here -- reaching
// d.grafana.query before authorize denies -- would mean querying with the
// plugin's own privileged identity despite the denial, which is exactly the
// privilege-escalation scenario authz.go exists to prevent.
func TestQueryDataDeniesWithoutQueryingWhenNoUser(t *testing.T) {
	var requests int

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++

		t.Errorf("unexpected request to %s -- no user on the request should deny before any network call", r.URL.Path)
	}))
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: nil},
		Queries: []backend.DataQuery{
			{
				RefID: "A", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: time.Now().Add(-time.Hour), To: time.Now()},
			},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Status != backend.StatusForbidden {
		t.Errorf("status = %v, want %v", resp.Responses["A"].Status, backend.StatusForbidden)
	}

	if requests != 0 {
		t.Errorf("made %d requests to Grafana, want 0 -- denial must happen before any network call", requests)
	}
}

// TestQueryDataIsolatesResolveFailures confirms an unknown queryType for one
// RefID does not block a valid query in the same request, and that the bad
// RefID never reaches the network.
func TestQueryDataIsolatesResolveFailures(t *testing.T) {
	var calls []capturedDsQuery

	srv := fakeGrafanaForQueryData(t, &calls)
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	tr := backend.TimeRange{From: time.Now().Add(-time.Hour), To: time.Now()}

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: &backend.User{Login: "tester"}},
		Queries: []backend.DataQuery{
			{RefID: "A", QueryType: "bogus", JSON: json.RawMessage(`{}`), TimeRange: tr},
			{RefID: "B", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`), TimeRange: tr},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Status != backend.StatusBadRequest {
		t.Errorf("query A status = %v, want %v", resp.Responses["A"].Status, backend.StatusBadRequest)
	}

	if resp.Responses["B"].Error != nil {
		t.Errorf("query B returned an error: %v", resp.Responses["B"].Error)
	}

	if len(calls) != 1 {
		t.Fatalf("made %d calls to /api/ds/query, want 1 (only for B)", len(calls))
	}

	if got := calls[0].refIDs; len(got) != 1 || got[0] != "B" {
		t.Errorf("the call carried refIDs %v, want only [B] -- A should never reach the network", got)
	}
}

// TestQueryDataIsolatesGrafanaQueryFailures confirms that when one query
// group's /api/ds/query call fails, only that group's queries are marked
// failed -- an unrelated group (here, distinguished by time range, same trick
// as TestQueryDataAppliesEachQueryOwnTimeRange) still returns real data.
func TestQueryDataIsolatesGrafanaQueryFailures(t *testing.T) {
	failFrom := strconv.FormatInt(time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC).UnixMilli(), 10)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		switch {
		case strings.HasPrefix(r.URL.Path, "/api/org/users/lookup"):
			_, _ = w.Write([]byte(`[{"userId":1,"login":"tester"}]`))
		case strings.HasPrefix(r.URL.Path, "/api/access-control/users/permissions/search"):
			_, _ = w.Write([]byte(`{"1":{"datasources:query":["datasources:*"]}}`))
		case r.URL.Path == "/api/ds/query":
			var body dsQueryRequest
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatalf("decoding /api/ds/query body: %v", err)
			}

			if body.From == failFrom {
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			results := map[string]any{}
			for _, q := range body.Queries {
				results[q.RefID] = map[string]any{"frames": []any{}}
			}

			_ = json.NewEncoder(w).Encode(map[string]any{"results": results})
		default:
			t.Errorf("unexpected request to %s", r.URL.Path)
		}
	}))
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	ds := &Datasource{
		settings:   settings{Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"}},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	failingTime := time.Date(2026, 1, 1, 9, 0, 0, 0, time.UTC)
	okTime := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: &backend.User{Login: "tester"}},
		Queries: []backend.DataQuery{
			{
				RefID: "A", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: failingTime, To: failingTime.Add(time.Hour)},
			},
			{
				RefID: "B", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: okTime, To: okTime.Add(time.Hour)},
			},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Status != backend.StatusInternal {
		t.Errorf("query A status = %v, want %v", resp.Responses["A"].Status, backend.StatusInternal)
	}

	if resp.Responses["B"].Error != nil {
		t.Errorf("query B returned an error even though its group succeeded: %v", resp.Responses["B"].Error)
	}
}

// TestQueryDataTargetForFailureIsBadRequest confirms an unconfigured backing
// datasource is reported as a client-correctable BadRequest, not an Internal
// error -- it is a configuration problem, not a server failure, and no query
// with an unresolved target should ever be reachable to send.
func TestQueryDataTargetForFailureIsBadRequest(t *testing.T) {
	var requests int

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++

		t.Errorf("unexpected request to %s -- an unconfigured target should fail before any network call", r.URL.Path)
	}))
	defer srv.Close()

	ctx := config.WithGrafanaConfig(t.Context(), config.NewGrafanaCfg(map[string]string{
		config.AppURL:          srv.URL,
		config.AppClientSecret: "plugin-token",
	}))

	// Metrics deliberately left unconfigured -- targetFor(targetMetrics) fails
	// even though probe_execution_rate itself resolves fine.
	ds := &Datasource{
		settings:   settings{},
		grafana:    newGrafanaClient(),
		authorizer: newAuthorizer(srv.Client()),
	}

	req := &backend.QueryDataRequest{
		PluginContext: backend.PluginContext{User: &backend.User{Login: "tester"}},
		Queries: []backend.DataQuery{
			{
				RefID: "A", QueryType: queryProbeExecutionRate, JSON: json.RawMessage(`{}`),
				TimeRange: backend.TimeRange{From: time.Now().Add(-time.Hour), To: time.Now()},
			},
		},
	}

	resp, err := ds.QueryData(ctx, req)
	if err != nil {
		t.Fatalf("QueryData: %v", err)
	}

	if resp.Responses["A"].Status != backend.StatusBadRequest {
		t.Errorf("status = %v, want %v", resp.Responses["A"].Status, backend.StatusBadRequest)
	}

	if requests != 0 {
		t.Errorf("made %d requests to Grafana, want 0", requests)
	}
}
