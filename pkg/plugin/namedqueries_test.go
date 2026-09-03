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
		name   string
		query  string
		params string
		expr   string
		target target
	}{
		{
			name:   "probe_execution_rate",
			query:  "probe_execution_rate",
			params: `{}`,
			expr:   `sum(rate(probe_all_success_count[3h])) by (probe)`,
			target: targetMetrics,
		},
		{
			name:   "probe_execution_rate ignores unknown params",
			query:  "probe_execution_rate",
			params: `{"job":"ignored"}`,
			expr:   `sum(rate(probe_all_success_count[3h])) by (probe)`,
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
			if !b.instant {
				t.Error("expected an instant query")
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
	if _, _, err := resolve("probe_execution_rate", json.RawMessage(`not json`)); err == nil {
		t.Fatal("expected an error for invalid parameter JSON")
	}
}

func TestNames(t *testing.T) {
	got := names()
	if len(got) != len(registry) {
		t.Errorf("names() returned %d entries, want %d", len(got), len(registry))
	}
}
