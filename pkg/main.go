package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/app"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/grafana/synthetic-monitoring-app/pkg/plugin"
)

// version is the version of the plugin. It is set at build time by the Mage
// target, which passes the version to the Go linker using `-X main.version=x.y.z`.
const pluginId = "grafana-synthetic-monitoring-app"

var version = "development"

func main() {
	plugin.PluginVersion = version

	log.DefaultLogger.Info("Starting plugin process", "version", version)

	// Manage handles the lifecycle of app instances, creating one per plugin
	// context. This call blocks until Grafana shuts the process down.
	if err := app.Manage(pluginId, plugin.NewApp, app.ManageOpts{}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
