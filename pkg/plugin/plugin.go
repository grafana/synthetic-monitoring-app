// Package plugin implements the Synthetic Monitoring backend datasource.
//
// The app's metric and log queries are normally assembled in the browser and
// sent straight to the Prometheus or Loki datasource. This backend lets the app
// ask for a query *by name* instead -- `checks_uptime` with a job and an
// instance, say -- and resolves that name to an expression against whichever
// backing datasource is appropriate. The app stops needing to know PromQL,
// LogQL, or which datasource holds what.
package plugin

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
)

// ID must match the id in src/datasource/plugin.json.
const ID = "synthetic-monitoring-datasource"

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

// Datasource is one configured instance of the SM datasource.
type Datasource struct {
	settings settings
	grafana  *grafanaClient
}

// NewDatasource is the instancemgmt factory registered with datasource.Manage.
func NewDatasource(_ context.Context, is backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var s settings
	if len(is.JSONData) > 0 {
		if err := json.Unmarshal(is.JSONData, &s); err != nil {
			return nil, fmt.Errorf("parsing datasource settings: %w", err)
		}
	}

	return &Datasource{settings: s, grafana: newGrafanaClient()}, nil
}

// Dispose satisfies instancemgmt.InstanceDisposer.
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
