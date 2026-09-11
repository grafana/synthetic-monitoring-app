// Package plugin contains the backend component of the Synthetic Monitoring
// app plugin.
//
// The backend is the nested `synthetic-monitoring-datasource` plugin declared in
// src/datasource/plugin.json, not the app itself. Grafana routes panel and scene
// queries through datasources, so a datasource is what future query-serving work
// needs; an app backend could not serve them.
//
// It reports its health, proxies Reliability Inbox suggestion requests so the
// browser never receives the datasource's stored access token, and proxies a
// Reliability Inbox health probe so the frontend can tell whether that
// experimental service is deployed in this region at all.
//
// The app's metric and log queries are normally assembled in the browser and
// sent straight to the Prometheus or Loki datasource. This backend lets the app
// ask for a query *by name* instead -- `probe_execution_rate`, say -- and
// resolves that name to an expression against whichever backing datasource is
// appropriate, querying it as the calling user rather than as itself.
package plugin

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// ID must match the id in src/datasource/plugin.json.
const ID = "synthetic-monitoring-datasource"

// PluginVersion is the version of the plugin, as stored in plugin.json. The
// `main` package sets this from a Mage-provided linker flag.
var PluginVersion = "development"

// Make sure Datasource implements the interfaces it is expected to. Without
// these assertions an unimplemented interface only surfaces as a runtime error.
var (
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
	_ backend.QueryDataHandler      = (*Datasource)(nil)
)

// linkedDatasource is a Prometheus or Loki datasource the SM datasource was
// configured against. Mirrors LinkedDatasourceInfo in src/datasource/types.ts.
type linkedDatasource struct {
	UID  string `json:"uid"`
	Type string `json:"type"`
}

// settings mirrors the subset of SMOptions (src/datasource/types.ts) the backend
// needs: which datasources hold this tenant's metrics and logs.
type settings struct {
	Metrics linkedDatasource `json:"metrics"`
	Logs    linkedDatasource `json:"logs"`
}

// Datasource is one configured instance of the Synthetic Monitoring datasource.
type Datasource struct {
	accessToken    string
	httpClient     *http.Client
	suggestionsURL string
	healthURL      string
	settings       settings
	grafana        *grafanaClient
	authorizer     *authorizer
}

// NewDatasource creates a new Datasource instance. It is called by the SDK once
// per datasource instance, and its result is cached until the instance settings
// change.
func NewDatasource(_ context.Context, is backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Debug("Creating new datasource instance", "version", PluginVersion)

	var jsonData struct {
		APIHost string `json:"apiHost"`
	}

	var s settings

	if len(is.JSONData) > 0 {
		if err := json.Unmarshal(is.JSONData, &jsonData); err != nil {
			return nil, fmt.Errorf("parsing datasource settings: %w", err)
		}

		if err := json.Unmarshal(is.JSONData, &s); err != nil {
			return nil, fmt.Errorf("parsing datasource settings: %w", err)
		}
	}

	base := reliabilityInboxBaseURL(jsonData.APIHost)

	var suggestionsURL, healthURL string
	if base != "" {
		suggestionsURL = base + "/api/v1alpha1/reliability-inbox/suggestions"
		healthURL = base + "/api/v1alpha1/reliability-inbox/health"
	}

	client := newGrafanaClient()

	return &Datasource{
		accessToken: is.DecryptedSecureJSONData["accessToken"],
		httpClient: &http.Client{
			Timeout: 90 * time.Second,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		suggestionsURL: suggestionsURL,
		healthURL:      healthURL,
		settings:       s,
		grafana:        client,
		authorizer:     newAuthorizer(client.http),
	}, nil
}

// Dispose is called before a cached Datasource instance is replaced, giving it a
// chance to release resources. There is nothing to clean up yet.
func (d *Datasource) Dispose() {}

// targetFor resolves which backing datasource a named query runs against.
func (d *Datasource) targetFor(target target) (linkedDatasource, error) {
	var ds linkedDatasource

	switch target {
	case targetMetrics:
		ds = d.settings.Metrics
	case targetLogs:
		ds = d.settings.Logs
	default:
		return ds, fmt.Errorf("unknown target %q", target)
	}

	if ds.UID == "" {
		return ds, fmt.Errorf("the Synthetic Monitoring datasource has no %s datasource configured", target)
	}

	return ds, nil
}

// CheckHealth reports whether the backing datasources are configured. It does
// not query them -- a tenant with no data yet is healthy.
func (d *Datasource) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	var missing []string

	if d.settings.Metrics.UID == "" {
		missing = append(missing, "metrics")
	}

	if d.settings.Logs.UID == "" {
		missing = append(missing, "logs")
	}

	if len(missing) > 0 {
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: "no " + strings.Join(missing, " or ") + " datasource configured",
		}, nil
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Synthetic Monitoring backend ready",
	}, nil
}

// CallResource handles the backend-only Reliability Inbox proxy endpoints.
func (d *Datasource) CallResource(
	ctx context.Context,
	req *backend.CallResourceRequest,
	sender backend.CallResourceResponseSender,
) error {
	switch req.Path {
	case "reliability-inbox/suggestions":
		return d.handleSuggestions(ctx, req, sender)
	case "reliability-inbox/health":
		return d.handleHealth(ctx, req, sender)
	default:
		return sendResourceResponse(sender, http.StatusNotFound, "resource not found")
	}
}

// handleSuggestions proxies to the co-located reliability-inbox deployment's
// suggestions endpoint, so the browser never receives the datasource's stored
// access token.
func (d *Datasource) handleSuggestions(
	ctx context.Context,
	req *backend.CallResourceRequest,
	sender backend.CallResourceResponseSender,
) error {
	if req.Method != http.MethodPost {
		return sendResourceResponse(sender, http.StatusMethodNotAllowed, "method not allowed")
	}

	if d.suggestionsURL == "" {
		return sendResourceResponse(sender, http.StatusNotFound, "reliability inbox is not available in this region")
	}

	if d.accessToken == "" {
		return sendResourceResponse(sender, http.StatusServiceUnavailable, "synthetic monitoring is not configured")
	}

	outbound, err := http.NewRequestWithContext(ctx, http.MethodPost, d.suggestionsURL, bytes.NewBufferString("{}"))
	if err != nil {
		return fmt.Errorf("creating reliability inbox request: %w", err)
	}

	outbound.Header.Set("Authorization", "Bearer "+d.accessToken)
	outbound.Header.Set("Content-Type", "application/json")

	response, err := d.httpClient.Do(outbound)
	if err != nil {
		return fmt.Errorf("requesting reliability inbox: %w", err)
	}
	defer response.Body.Close()

	const maxResponseBytes = 1 << 20

	body, err := io.ReadAll(io.LimitReader(response.Body, maxResponseBytes+1))
	if err != nil {
		return fmt.Errorf("reading reliability inbox response: %w", err)
	}

	if len(body) > maxResponseBytes {
		return sendResourceResponse(sender, http.StatusBadGateway, "reliability inbox response is too large")
	}

	return sender.Send(&backend.CallResourceResponse{
		Status: response.StatusCode,
		Headers: map[string][]string{
			"Content-Type": {response.Header.Get("Content-Type")},
		},
		Body: body,
	})
}

// handleHealth proxies to the co-located reliability-inbox deployment's own
// health probe. The frontend uses a 200 here to decide whether to show any
// check-suggestion UI at all — a real availability check instead of guessing
// from the datasource's apiHost, and it needs no access token because the
// probe answers before any tenant identity is involved.
func (d *Datasource) handleHealth(
	ctx context.Context,
	req *backend.CallResourceRequest,
	sender backend.CallResourceResponseSender,
) error {
	if req.Method != http.MethodGet {
		return sendResourceResponse(sender, http.StatusMethodNotAllowed, "method not allowed")
	}

	if d.healthURL == "" {
		return sendResourceResponse(sender, http.StatusNotFound, "reliability inbox is not available in this region")
	}

	outbound, err := http.NewRequestWithContext(ctx, http.MethodGet, d.healthURL, nil)
	if err != nil {
		return fmt.Errorf("creating reliability inbox health request: %w", err)
	}

	response, err := d.httpClient.Do(outbound)
	if err != nil {
		// Unreachable is a legitimate "not available" answer here, not a
		// failure worth erroring the resource call over — the caller only
		// distinguishes 200 from everything else.
		return sendResourceResponse(sender, http.StatusBadGateway, "reliability inbox is not reachable in this region")
	}
	defer response.Body.Close()

	return sendResourceResponse(sender, response.StatusCode, "reliability inbox health check")
}

func reliabilityInboxBaseURL(apiHost string) string {
	trimmed := strings.TrimSpace(apiHost)
	if trimmed == "" {
		return ""
	}

	if !strings.Contains(trimmed, "://") {
		trimmed = "https://" + trimmed
	}

	parsed, err := url.Parse(trimmed)
	if err != nil {
		return ""
	}

	hostname := strings.ToLower(parsed.Hostname())

	const apiPrefix = "synthetic-monitoring-api-"

	hostParts := strings.Split(hostname, ".")
	if len(hostParts) < 2 {
		return ""
	}

	label := hostParts[0]
	domain := strings.Join(hostParts[1:], ".")

	environment := ""

	switch {
	case strings.HasSuffix(hostname, ".grafana-dev.net"):
		environment = "dev"
	case strings.HasSuffix(hostname, ".grafana-ops.net"):
		environment = "ops"
	}

	if environment == "" || !strings.HasPrefix(label, apiPrefix) {
		return ""
	}

	region := strings.TrimPrefix(label, apiPrefix)
	if environment == "dev" && region == "dev" {
		region = "us-central-0"
	}

	if region == "" {
		return ""
	}

	return fmt.Sprintf("https://k6-experiments-%s-%s.%s", environment, region, domain)
}

func sendResourceResponse(sender backend.CallResourceResponseSender, status int, message string) error {
	body, err := json.Marshal(map[string]string{"message": message})
	if err != nil {
		return fmt.Errorf("encoding resource response: %w", err)
	}

	if err := sender.Send(&backend.CallResourceResponse{
		Status: status,
		Headers: map[string][]string{
			"Content-Type": {"application/json"},
		},
		Body: body,
	}); err != nil {
		return fmt.Errorf("sending resource response: %w", err)
	}

	return nil
}
