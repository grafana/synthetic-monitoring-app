package plugin

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/config"
)

func TestGrafanaClientQuery(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		body       string
		wantErr    string
	}{
		{
			name:       "success",
			statusCode: http.StatusOK,
			body:       `{"results":{"A":{"frames":[]}}}`,
		},
		{
			// /api/ds/query answers 400 when a single query fails but still returns
			// a per-refId body, so this must decode rather than error.
			name:       "per-query failure still decodes",
			statusCode: http.StatusBadRequest,
			body:       `{"results":{"A":{"error":"bad query"}}}`,
		},
		{
			name:       "unauthorized is a hard failure",
			statusCode: http.StatusUnauthorized,
			body:       `{}`,
			wantErr:    "unexpected status",
		},
		{
			name:       "forbidden is a hard failure",
			statusCode: http.StatusForbidden,
			body:       `{}`,
			wantErr:    "unexpected status",
		},
		{
			name:       "server error is a hard failure",
			statusCode: http.StatusInternalServerError,
			body:       `{}`,
			wantErr:    "unexpected status",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var gotBody dsQueryRequest
			var gotAuth string

			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path != "/api/ds/query" {
					t.Errorf("request path = %q, want /api/ds/query", r.URL.Path)
				}
				gotAuth = r.Header.Get("Authorization")
				if err := json.NewDecoder(r.Body).Decode(&gotBody); err != nil {
					t.Errorf("decoding request body: %v", err)
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(tt.statusCode)
				_, _ = w.Write([]byte(tt.body))
			}))
			defer srv.Close()

			c := newGrafanaClient()
			from := time.Now().Add(-time.Hour)
			to := time.Now()

			queries := []dsQuery{{RefID: "A", Expr: "up", Datasource: linkedDatasource{UID: "prom-uid"}, Instant: true}}

			resp, err := c.query(context.Background(), srv.URL, "plugin-token", from, to, queries)

			if tt.wantErr != "" {
				if err == nil {
					t.Fatalf("expected an error containing %q, got nil", tt.wantErr)
				}
				return
			}

			if err != nil {
				t.Fatalf("query: %v", err)
			}
			if resp == nil {
				t.Fatal("expected a non-nil response")
			}
			if gotAuth != "Bearer plugin-token" {
				t.Errorf("Authorization header = %q, want %q", gotAuth, "Bearer plugin-token")
			}
			if len(gotBody.Queries) != 1 || gotBody.Queries[0].RefID != "A" {
				t.Errorf("request body queries = %+v, want one query with RefID A", gotBody.Queries)
			}
		})
	}
}

func TestAppURL(t *testing.T) {
	t.Run("prefers the configured app URL", func(t *testing.T) {
		ctx := config.WithGrafanaConfig(context.Background(), config.NewGrafanaCfg(map[string]string{
			config.AppURL: "http://grafana.example.com/",
		}))

		if got := appURL(ctx); got != "http://grafana.example.com" {
			t.Errorf("appURL() = %q, want the trailing slash trimmed", got)
		}
	})

	t.Run("falls back to the dev default when absent", func(t *testing.T) {
		if got := appURL(context.Background()); got != devAppURL {
			t.Errorf("appURL() = %q, want %q", got, devAppURL)
		}
	})
}

func TestPluginToken(t *testing.T) {
	t.Run("reads the configured secret", func(t *testing.T) {
		ctx := config.WithGrafanaConfig(context.Background(), config.NewGrafanaCfg(map[string]string{
			config.AppClientSecret: "the-secret",
		}))

		if got := pluginToken(ctx); got != "the-secret" {
			t.Errorf("pluginToken() = %q, want %q", got, "the-secret")
		}
	})

	t.Run("falls back to empty when absent", func(t *testing.T) {
		if got := pluginToken(context.Background()); got != "" {
			t.Errorf("pluginToken() = %q, want empty", got)
		}
	})
}
