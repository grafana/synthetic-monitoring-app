package plugin

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

func TestNewDatasource(t *testing.T) {
	instance, err := NewDatasource(t.Context(), backend.DataSourceInstanceSettings{
		JSONData: json.RawMessage(`{"apiHost":"https://synthetic-monitoring-api-dev.grafana-dev.net"}`),
		DecryptedSecureJSONData: map[string]string{
			"accessToken": "stored-token",
		},
	})
	if err != nil {
		t.Fatalf("creating datasource: %v", err)
	}

	ds, ok := instance.(*Datasource)
	if !ok {
		t.Fatalf("got instance of type %T, want *Datasource", instance)
	}

	if ds.accessToken != "stored-token" {
		t.Errorf("got access token %q, want stored token", ds.accessToken)
	}

	if ds.suggestionsURL != "https://k6-experiments-dev-us-central-0.grafana-dev.net/api/v1alpha1/reliability-inbox/suggestions" {
		t.Errorf("got suggestions URL %q", ds.suggestionsURL)
	}

	if ds.healthURL != "https://k6-experiments-dev-us-central-0.grafana-dev.net/api/v1alpha1/reliability-inbox/health" {
		t.Errorf("got health URL %q", ds.healthURL)
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

func TestReliabilityInboxBaseURL(t *testing.T) {
	tests := map[string]struct {
		apiHost string
		want    string
	}{
		"dev alias": {
			apiHost: "https://synthetic-monitoring-api-dev.grafana-dev.net",
			want:    "https://k6-experiments-dev-us-central-0.grafana-dev.net",
		},
		"ops region": {
			apiHost: "synthetic-monitoring-api-eu-west-2.grafana-ops.net",
			want:    "https://k6-experiments-ops-eu-west-2.grafana-ops.net",
		},
		"preserves deployment domain": {
			apiHost: "synthetic-monitoring-api-eu-west-2.example.grafana-ops.net",
			want:    "https://k6-experiments-ops-eu-west-2.example.grafana-ops.net",
		},
		"untrusted host": {
			apiHost: "https://example.com",
			want:    "",
		},
	}

	for name, test := range tests {
		t.Run(name, func(t *testing.T) {
			if got := reliabilityInboxBaseURL(test.apiHost); got != test.want {
				t.Errorf("got %q, want %q", got, test.want)
			}
		})
	}
}

func TestCallResourceProxiesSuggestionsWithStoredToken(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodPost {
			t.Errorf("got method %q, want POST", req.Method)
		}

		if got := req.Header.Get("Authorization"); got != "Bearer stored-token" {
			t.Errorf("got authorization %q", got)
		}

		body, err := io.ReadAll(req.Body)
		if err != nil {
			t.Errorf("reading request body: %v", err)
		}

		if string(body) != "{}" {
			t.Errorf("got body %q, want {}", body)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusAccepted)

		if _, err := w.Write([]byte(`{"suggestions":[]}`)); err != nil {
			t.Errorf("writing response: %v", err)
		}
	}))
	t.Cleanup(server.Close)

	ds := &Datasource{
		accessToken:    "stored-token",
		httpClient:     server.Client(),
		suggestionsURL: server.URL,
	}
	sender := &recordingSender{}

	err := ds.CallResource(t.Context(), &backend.CallResourceRequest{
		Path:   "reliability-inbox/suggestions",
		Method: http.MethodPost,
	}, sender)
	if err != nil {
		t.Fatalf("calling resource: %v", err)
	}

	if sender.response.Status != http.StatusAccepted {
		t.Errorf("got status %d, want %d", sender.response.Status, http.StatusAccepted)
	}

	if string(sender.response.Body) != `{"suggestions":[]}` {
		t.Errorf("got body %q", sender.response.Body)
	}
}

func TestCallResourceProxiesHealth(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodGet {
			t.Errorf("got method %q, want GET", req.Method)
		}

		if got := req.Header.Get("Authorization"); got != "" {
			t.Errorf("got authorization %q, want none: health does not need the stored token", got)
		}

		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(server.Close)

	ds := &Datasource{
		httpClient: server.Client(),
		healthURL:  server.URL,
	}
	sender := &recordingSender{}

	err := ds.CallResource(t.Context(), &backend.CallResourceRequest{
		Path:   "reliability-inbox/health",
		Method: http.MethodGet,
	}, sender)
	if err != nil {
		t.Fatalf("calling resource: %v", err)
	}

	if sender.response.Status != http.StatusOK {
		t.Errorf("got status %d, want %d", sender.response.Status, http.StatusOK)
	}
}

func TestCallResourceHealthNotAvailableInRegion(t *testing.T) {
	ds := &Datasource{}
	sender := &recordingSender{}

	err := ds.CallResource(t.Context(), &backend.CallResourceRequest{
		Path:   "reliability-inbox/health",
		Method: http.MethodGet,
	}, sender)
	if err != nil {
		t.Fatalf("calling resource: %v", err)
	}

	if sender.response.Status != http.StatusNotFound {
		t.Errorf("got status %d, want %d", sender.response.Status, http.StatusNotFound)
	}
}

func TestCallResourceHealthRejectsNonGet(t *testing.T) {
	ds := &Datasource{healthURL: "http://unused.example.com"}
	sender := &recordingSender{}

	err := ds.CallResource(t.Context(), &backend.CallResourceRequest{
		Path:   "reliability-inbox/health",
		Method: http.MethodPost,
	}, sender)
	if err != nil {
		t.Fatalf("calling resource: %v", err)
	}

	if sender.response.Status != http.StatusMethodNotAllowed {
		t.Errorf("got status %d, want %d", sender.response.Status, http.StatusMethodNotAllowed)
	}
}

type recordingSender struct {
	response *backend.CallResourceResponse
}

func (s *recordingSender) Send(response *backend.CallResourceResponse) error {
	s.response = response
	return nil
}

var _ backend.CallResourceResponseSender = (*recordingSender)(nil)
