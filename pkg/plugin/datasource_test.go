package plugin

import (
	"encoding/json"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestNewDatasource(t *testing.T) {
	settingsJSON, err := json.Marshal(map[string]any{
		"metrics": map[string]string{"uid": "prom-uid", "type": "prometheus"},
		"logs":    map[string]string{"uid": "loki-uid", "type": "loki"},
	})
	if err != nil {
		t.Fatalf("marshaling settings: %v", err)
	}

	instance, err := NewDatasource(t.Context(), backend.DataSourceInstanceSettings{JSONData: settingsJSON})
	if err != nil {
		t.Fatalf("creating datasource: %v", err)
	}

	ds, ok := instance.(*Datasource)
	if !ok {
		t.Fatalf("got instance of type %T, want *Datasource", instance)
	}

	if ds.settings.Metrics.UID != "prom-uid" {
		t.Errorf("Metrics.UID = %q, want %q", ds.settings.Metrics.UID, "prom-uid")
	}
	if ds.settings.Logs.UID != "loki-uid" {
		t.Errorf("Logs.UID = %q, want %q", ds.settings.Logs.UID, "loki-uid")
	}
	if ds.grafana == nil {
		t.Error("grafana client was not initialized")
	}
	if ds.authorizer == nil {
		t.Error("authorizer was not initialized")
	}
}

func TestNewDatasourceInvalidSettings(t *testing.T) {
	_, err := NewDatasource(t.Context(), backend.DataSourceInstanceSettings{JSONData: []byte("not json")})
	if err == nil {
		t.Fatal("expected an error parsing invalid settings JSON")
	}
}

func TestTargetFor(t *testing.T) {
	ds := &Datasource{
		settings: settings{
			Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"},
		},
	}

	got, err := ds.targetFor(targetMetrics)
	if err != nil {
		t.Fatalf("targetFor(metrics): %v", err)
	}
	if got.UID != "prom-uid" {
		t.Errorf("targetFor(metrics).UID = %q, want %q", got.UID, "prom-uid")
	}

	if _, err := ds.targetFor(targetLogs); err == nil {
		t.Error("expected an error for the unconfigured logs datasource")
	}

	if _, err := ds.targetFor(target("bogus")); err == nil {
		t.Error("expected an error for an unknown target")
	}
}

func TestCheckHealth(t *testing.T) {
	tests := []struct {
		name     string
		settings settings
		want     backend.HealthStatus
	}{
		{
			name: "both datasources configured",
			settings: settings{
				Metrics: linkedDatasource{UID: "prom-uid"},
				Logs:    linkedDatasource{UID: "loki-uid"},
			},
			want: backend.HealthStatusOk,
		},
		{
			name:     "no datasources configured",
			settings: settings{},
			want:     backend.HealthStatusError,
		},
		{
			name: "only metrics configured",
			settings: settings{
				Metrics: linkedDatasource{UID: "prom-uid"},
			},
			want: backend.HealthStatusError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ds := &Datasource{settings: tt.settings}

			res, err := ds.CheckHealth(t.Context(), &backend.CheckHealthRequest{})
			if err != nil {
				t.Fatalf("checking health: %v", err)
			}

			if res.Status != tt.want {
				t.Errorf("got status %v, want %v", res.Status, tt.want)
			}
		})
	}
}
