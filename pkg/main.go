package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"

	"github.com/grafana/synthetic-monitoring-app/pkg/plugin"
)

func main() {
	if err := datasource.Manage(plugin.ID, plugin.NewDatasource, datasource.ManageOpts{}); err != nil {
		log.DefaultLogger.Error("failed to start plugin", "error", err)
		os.Exit(1)
	}
}
