package plugin

import (
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestNewDatasource(t *testing.T) {
	instance, err := NewDatasource(t.Context(), backend.DataSourceInstanceSettings{})
	if err != nil {
		t.Fatalf("creating datasource: %v", err)
	}

	if _, ok := instance.(*Datasource); !ok {
		t.Fatalf("got instance of type %T, want *Datasource", instance)
	}
}

func TestCheckHealth(t *testing.T) {
	ds := &Datasource{}

	res, err := ds.CheckHealth(t.Context(), &backend.CheckHealthRequest{})
	if err != nil {
		t.Fatalf("checking health: %v", err)
	}

	if res.Status != backend.HealthStatusOk {
		t.Errorf("got status %v, want %v", res.Status, backend.HealthStatusOk)
	}
}
