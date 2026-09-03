// Package plugin contains the backend component of the Synthetic Monitoring
// app plugin.
//
// The backend is the nested `synthetic-monitoring-datasource` plugin declared in
// src/datasource/plugin.json, not the app itself. Grafana routes panel and scene
// queries through datasources, so a datasource is what future query-serving work
// needs; an app backend could not serve them.
//
// The app's metric and log queries are normally assembled in the browser and
// sent straight to the Prometheus or Loki datasource. This backend lets the app
// ask for a query *by name* instead -- `probe_execution_rate`, say -- and
// resolves that name to an expression against whichever backing datasource is
// appropriate, querying it as the calling user rather than as itself. See
// authz.go for why that distinction matters.
package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

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
	settings   settings
	grafana    *grafanaClient
	authorizer *authorizer
}

// NewDatasource creates a new Datasource instance. It is called by the SDK once
// per datasource instance, and its result is cached until the instance settings
// change.
func NewDatasource(_ context.Context, is backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Debug("Creating new datasource instance", "version", PluginVersion)

	var s settings
	if len(is.JSONData) > 0 {
		if err := json.Unmarshal(is.JSONData, &s); err != nil {
			return nil, fmt.Errorf("parsing datasource settings: %w", err)
		}
	}

	client := newGrafanaClient()

	return &Datasource{
		settings:   s,
		grafana:    client,
		authorizer: newAuthorizer(client.http),
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
