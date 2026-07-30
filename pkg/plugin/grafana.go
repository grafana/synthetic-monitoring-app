package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/config"
)

// POC: Grafana's own address. Inside the dev container this is Grafana itself.
// GrafanaConfig.AppURL() is preferred and tried first; this is the fallback.
const devAppURL = "http://localhost:3000"

// grafanaClient queries other datasources by going back through Grafana's own
// /api/ds/query endpoint, which is what lets this backend reuse whatever
// authentication and label policy those datasources are configured with.
//
// POC LIMITATION: no credentials are attached. This works only because the dev
// container enables anonymous access with the Admin role (.config/Dockerfile,
// dev/custom.ini). A real implementation has to either mint a service account
// token or forward the requesting user's identity -- see the plan's "Known gaps".
type grafanaClient struct {
	http *http.Client
}

func newGrafanaClient() *grafanaClient {
	return &grafanaClient{http: &http.Client{Timeout: 60 * time.Second}}
}

// dsQuery is one entry in an /api/ds/query request. The field names match what
// the Prometheus and Loki datasources expect.
type dsQuery struct {
	RefID         string           `json:"refId"`
	Expr          string           `json:"expr"`
	Datasource    linkedDatasource `json:"datasource"`
	QueryType     string           `json:"queryType,omitempty"`
	Range         bool             `json:"range"`
	Instant       bool             `json:"instant"`
	Interval      string           `json:"interval,omitempty"`
	IntervalMs    int64            `json:"intervalMs,omitempty"`
	MaxDataPoints int64            `json:"maxDataPoints,omitempty"`
}

type dsQueryRequest struct {
	From    string    `json:"from"`
	To      string    `json:"to"`
	Queries []dsQuery `json:"queries"`
}

// query sends the given queries to Grafana and returns its response verbatim.
//
// The response decodes straight into backend.QueryDataResponse, which implements
// UnmarshalJSON, so frames pass through untouched -- whatever Prometheus or Loki
// produced is exactly what the browser receives.
func (c *grafanaClient) query(ctx context.Context, appURL, token string, from, to time.Time, queries []dsQuery) (*backend.QueryDataResponse, error) {
	body, err := json.Marshal(dsQueryRequest{
		From:    strconv.FormatInt(from.UnixMilli(), 10),
		To:      strconv.FormatInt(to.UnixMilli(), 10),
		Queries: queries,
	})
	if err != nil {
		return nil, fmt.Errorf("encoding query: %w", err)
	}

	url := appURL + "/api/ds/query"

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("querying %s: %w", url, err)
	}
	defer func() { _ = resp.Body.Close() }()

	// /api/ds/query answers 400 when any single query failed but still returns a
	// per-refId body, so only treat other non-2xx codes as hard failures.
	if resp.StatusCode >= 500 || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("querying %s: unexpected status %s", url, resp.Status)
	}

	var out backend.QueryDataResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, fmt.Errorf("decoding response from %s: %w", url, err)
	}

	return &out, nil
}

// appURL resolves Grafana's own base url, falling back to the dev default.
//
// AppURL() comes back with a trailing slash; without trimming it the request goes
// to `//api/ds/query`, which Grafana answers with the SPA's HTML rather than the
// API.
func appURL(ctx context.Context) string {
	if cfg := config.GrafanaConfigFromContext(ctx); cfg != nil {
		if url, err := cfg.AppURL(); err == nil && url != "" {
			return strings.TrimSuffix(url, "/")
		}
	}

	return devAppURL
}

// pluginToken returns the plugin's own service account token, issued from the
// `iam` block in plugin.json and delivered as GF_PLUGIN_APP_CLIENT_SECRET.
//
// It authenticates the plugin to Grafana; it says nothing about who is asking.
// That is what the authorizer is for.
func pluginToken(ctx context.Context) string {
	if cfg := config.GrafanaConfigFromContext(ctx); cfg != nil {
		if secret, err := cfg.PluginAppClientSecret(); err == nil {
			return secret
		}
	}

	return ""
}
