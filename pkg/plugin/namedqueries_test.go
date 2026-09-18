package plugin

import (
	"encoding/json"
	"testing"
)

// The expression below is copied from src/queries/probeExecutionStats.ts. If
// either side changes, this test should fail rather than the app quietly
// asking for something different than it used to.
func TestRegistryExpressions(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		params  string
		expr    string
		target  target
		instant bool
	}{
		{
			name:    queryProbeExecutionRate,
			query:   queryProbeExecutionRate,
			params:  `{}`,
			expr:    `sum(rate(probe_all_success_count[3h])) by (probe)`,
			target:  targetMetrics,
			instant: true,
		},
		{
			name:    "probe_execution_rate ignores unknown params",
			query:   queryProbeExecutionRate,
			params:  `{"job":"ignored"}`,
			expr:    `sum(rate(probe_all_success_count[3h])) by (probe)`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// Ported from src/queries/uptime.ts -- deliberately a range query, not
			// instant: the panel it backs plots uptime over time.
			name:   queryChecksUptime,
			query:  queryChecksUptime,
			params: `{"job":"test","instance":"https://grafana.com","frequency":60000}`,
			expr:   `max by () (max_over_time(probe_success{job="test", instance="https://grafana.com", probe=~".*"}[60s]))`,
			target: targetMetrics,
		},
		{
			name:   "checks_uptime escapes label values",
			query:  queryChecksUptime,
			params: `{"job":"has \"quotes\"","instance":"x","frequency":60000}`,
			expr:   `max by () (max_over_time(probe_success{job="has \"quotes\"", instance="x", probe=~".*"}[60s]))`,
			target: targetMetrics,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			nq, b, err := resolve(tt.query, json.RawMessage(tt.params))
			if err != nil {
				t.Fatalf("resolve: %v", err)
			}

			if b.expr != tt.expr {
				t.Errorf("expr = %q, want %q", b.expr, tt.expr)
			}

			if nq.target != tt.target {
				t.Errorf("target = %q, want %q", nq.target, tt.target)
			}

			if b.instant != tt.instant {
				t.Errorf("instant = %v, want %v", b.instant, tt.instant)
			}
		})
	}
}

// TestChecksUptimeRejectsMissingParams pins the required-parameter validation
// checks_uptime inherits from CheckQuery.check() and
// CheckFrequencyQuery.intervalFromFrequency().
func TestChecksUptimeRejectsMissingParams(t *testing.T) {
	tests := []struct {
		name   string
		params string
	}{
		{name: "missing job", params: `{"instance":"x","frequency":60000}`},
		{name: "missing instance", params: `{"job":"x","frequency":60000}`},
		{name: "zero frequency", params: `{"job":"x","instance":"x","frequency":0}`},
		{name: "negative frequency", params: `{"job":"x","instance":"x","frequency":-1}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, _, err := resolve(queryChecksUptime, json.RawMessage(tt.params)); err == nil {
				t.Fatal("expected an error")
			}
		})
	}
}

func TestResolveUnknownQuery(t *testing.T) {
	if _, _, err := resolve("bogus", nil); err == nil {
		t.Fatal("expected an error for an unknown query name")
	}
}

func TestResolveInvalidParams(t *testing.T) {
	if _, _, err := resolve(queryProbeExecutionRate, json.RawMessage(`not json`)); err == nil {
		t.Fatal("expected an error for invalid parameter JSON")
	}
}

func TestNames(t *testing.T) {
	got := names()
	if len(got) != len(registry) {
		t.Errorf("names() returned %d entries, want %d", len(got), len(registry))
	}
}
