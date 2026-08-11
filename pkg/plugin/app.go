// Package plugin contains the backend component of the Synthetic Monitoring
// app plugin.
//
// The backend currently does nothing beyond starting up and reporting its
// health. It exists to verify that the plugin binary is built, packaged,
// signed, shipped and started correctly. It exposes no resources, and no
// frontend code calls it, so enabling the backend does not change plugin
// behaviour.
package plugin

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
)

// PluginVersion is the version of the plugin, as stored in plugin.json. The
// `main` package sets this from a Mage-provided linker flag.
var PluginVersion = "development"

// Make sure App implements the interfaces it is expected to. Without these
// assertions an unimplemented interface only surfaces as a runtime error.
var (
	_ instancemgmt.InstanceDisposer = (*App)(nil)
	_ backend.CheckHealthHandler    = (*App)(nil)
)

// App is the Synthetic Monitoring app backend.
type App struct{}

// NewApp creates a new App instance. It is called by the SDK once per plugin
// context, and its result is cached until the plugin settings change.
func NewApp(_ context.Context, _ backend.AppInstanceSettings) (instancemgmt.Instance, error) {
	log.DefaultLogger.Debug("Creating new app instance", "version", PluginVersion)

	return &App{}, nil
}

// Dispose is called before a cached App instance is replaced, giving it a
// chance to release resources. There is nothing to clean up yet.
func (a *App) Dispose() {}

// CheckHealth reports the plugin's health to Grafana. Since the backend has no
// dependencies of its own, it is healthy whenever the process is running.
func (a *App) CheckHealth(_ context.Context, _ *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "ok",
	}, nil
}
