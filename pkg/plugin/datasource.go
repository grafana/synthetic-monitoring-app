// Package plugin contains the backend component of the Synthetic Monitoring
// app plugin.
//
// The backend is the nested `synthetic-monitoring-datasource` plugin declared in
// src/datasource/plugin.json, not the app itself. Grafana routes panel and scene
// queries through datasources, so a datasource is what future query-serving work
// needs; an app backend could not serve them.
//
// It currently does nothing beyond starting up and reporting its health. It
// exists to verify that the plugin binary is built, packaged, signed, shipped and
// started correctly. It serves no queries and no resources, and no frontend code
// calls it, so enabling the backend does not change plugin behaviour.
package plugin

import (
	"context"

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
)

// Datasource is one configured instance of the Synthetic Monitoring datasource.
type Datasource struct{}

// NewDatasource creates a new Datasource instance. It is called by the SDK once
// per datasource instance, and its result is cached until the instance settings
// change.
func NewDatasource(_ context.Context, _ backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Debug("Creating new datasource instance", "version", PluginVersion)

	return &Datasource{}, nil
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
