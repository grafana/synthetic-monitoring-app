package plugin

import (
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestNewApp(t *testing.T) {
	instance, err := NewApp(t.Context(), backend.AppInstanceSettings{})
	if err != nil {
		t.Fatalf("creating app: %v", err)
	}

	if _, ok := instance.(*App); !ok {
		t.Fatalf("got instance of type %T, want *App", instance)
	}
}

func TestCheckHealth(t *testing.T) {
	app := &App{}

	res, err := app.CheckHealth(t.Context(), &backend.CheckHealthRequest{})
	if err != nil {
		t.Fatalf("checking health: %v", err)
	}

	if res.Status != backend.HealthStatusOk {
		t.Errorf("got status %v, want %v", res.Status, backend.HealthStatusOk)
	}
}
