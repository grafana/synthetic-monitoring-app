package plugin

import (
	"encoding/json"
	"testing"
)

// The expressions below are copied from the frontend they were ported from. If
// either side changes, this test should fail rather than the app quietly asking
// for something different than it used to.
func TestRegistryExpressions(t *testing.T) {
	tests := []struct {
		name     string
		query    string
		params   string
		expr     string
		target   target
		interval string
	}{
		{
			// src/queries/uptime.ts
			name:     "checks_uptime",
			query:    "checks_uptime",
			params:   `{"job":"my job","instance":"https://grafana.com","frequency":60000}`,
			expr:     `max by () (max_over_time(probe_success{job="my job", instance="https://grafana.com", probe=~".*"}[60s]))`,
			target:   targetMetrics,
			interval: "60s",
		},
		{
			name:     "checks_uptime with a probe filter",
			query:    "checks_uptime",
			params:   `{"job":"j","instance":"i","probe":"Frankfurt|London","frequency":10000}`,
			expr:     `max by () (max_over_time(probe_success{job="j", instance="i", probe=~"Frankfurt|London"}[10s]))`,
			target:   targetMetrics,
			interval: "10s",
		},
		{
			// src/scenes/Common/ErrorLogsPanel.tsx
			name:   "check_error_logs",
			query:  "check_error_logs",
			params: `{"job":"j","instance":"i","probe":"Frankfurt"}`,
			expr:   `{probe=~"Frankfurt", instance="i", job="j", probe_success=~".*"} | logfmt`,
			target: targetLogs,
		},
		{
			name:   "check_error_logs restricted to failures",
			query:  "check_error_logs",
			params: `{"job":"j","instance":"i","unsuccessfulOnly":true}`,
			expr:   `{probe=~".*", instance="i", job="j", probe_success=~"0"} | logfmt`,
			target: targetLogs,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			nq, b, err := resolve(tt.query, json.RawMessage(tt.params))
			if err != nil {
				t.Fatalf("resolve: %v", err)
			}

			if b.expr != tt.expr {
				t.Errorf("expr mismatch\n got: %s\nwant: %s", b.expr, tt.expr)
			}
			if nq.target != tt.target {
				t.Errorf("target = %q, want %q", nq.target, tt.target)
			}
			if b.interval != tt.interval {
				t.Errorf("interval = %q, want %q", b.interval, tt.interval)
			}
		})
	}
}

func TestResolveRejectsBadInput(t *testing.T) {
	tests := []struct {
		name   string
		query  string
		params string
	}{
		{"unknown query name", "checks_downtime", `{"job":"j","instance":"i","frequency":1000}`},
		{"missing job", "checks_uptime", `{"instance":"i","frequency":1000}`},
		{"missing instance", "checks_uptime", `{"job":"j","frequency":1000}`},
		{"missing frequency", "checks_uptime", `{"job":"j","instance":"i"}`},
		{"logs missing instance", "check_error_logs", `{"job":"j"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, _, err := resolve(tt.query, json.RawMessage(tt.params)); err == nil {
				t.Fatalf("expected an error for %s", tt.name)
			}
		})
	}
}

func TestTargetForRequiresConfiguredDatasource(t *testing.T) {
	d := &Datasource{settings: settings{
		Metrics: linkedDatasource{UID: "prom-uid", Type: "prometheus"},
	}}

	metrics, err := d.targetFor(targetMetrics)
	if err != nil {
		t.Fatalf("targetFor(metrics): %v", err)
	}
	if metrics.UID != "prom-uid" {
		t.Errorf("metrics uid = %q, want prom-uid", metrics.UID)
	}

	// logs is unset, so asking for it is an error rather than a request to uid ""
	if _, err := d.targetFor(targetLogs); err == nil {
		t.Error("expected an error when no logs datasource is configured")
	}
}
