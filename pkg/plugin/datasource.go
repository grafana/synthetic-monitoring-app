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
)

// Datasource is one configured instance of the Synthetic Monitoring datasource.
type Datasource struct {
	accessToken    string
	httpClient     *http.Client
	suggestionsURL string
	healthURL      string
}

// NewDatasource creates a new Datasource instance. It is called by the SDK once
// per datasource instance, and its result is cached until the instance settings
// change.
func NewDatasource(_ context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Debug("Creating new datasource instance", "version", PluginVersion)

	var jsonData struct {
		APIHost string `json:"apiHost"`
	}
	if len(settings.JSONData) > 0 {
		if err := json.Unmarshal(settings.JSONData, &jsonData); err != nil {
			return nil, fmt.Errorf("parsing datasource settings: %w", err)
		}
	}

	base := reliabilityInboxBaseURL(jsonData.APIHost)

	var suggestionsURL, healthURL string
	if base != "" {
		suggestionsURL = base + "/api/v1alpha1/reliability-inbox/suggestions"
		healthURL = base + "/api/v1alpha1/reliability-inbox/health"
	}

	return &Datasource{
		accessToken: settings.DecryptedSecureJSONData["accessToken"],
		httpClient: &http.Client{
			Timeout: 90 * time.Second,
			CheckRedirect: func(_ *http.Request, _ []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		suggestionsURL: suggestionsURL,
		healthURL:      healthURL,
	}, nil
}

// Dispose is called before a cached Datasource instance is replaced, giving it a
// chance to release resources. There is nothing to clean up yet.
func (d *Datasource) Dispose() {}

// CheckHealth reports the datasource's health to Grafana. Since the backend has
// no dependencies of its own, it is healthy whenever the process is running.
func (d *Datasource) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "ok",
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
