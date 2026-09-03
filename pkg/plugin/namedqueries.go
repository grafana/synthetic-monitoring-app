package plugin

import (
	"encoding/json"
	"fmt"
)

// target names one of the datasources the SM datasource is linked to.
type target string

const (
	targetMetrics target = "metrics"
	targetLogs    target = "logs"
)

// defaultQueryFromTime mirrors DEFAULT_QUERY_FROM_TIME in components/constants.ts.
const defaultQueryFromTime = "3h"

// built is what a named query resolves to: an expression plus the execution
// options the backing datasource needs.
type built struct {
	expr          string
	instant       bool
	interval      string
	maxDataPoints int64
}

// namedQuery is one entry in the registry. build takes the raw parameter JSON
// the frontend sent so each entry can unmarshal into its own shape (see
// queryshapes.go) rather than a struct shared by every entry.
type namedQuery struct {
	target target
	build  func(json.RawMessage) (built, error)
}

// parseParams unmarshals a named query's raw parameter JSON into its declared
// shape. An empty body is valid for shapes where every field is optional (or
// there are none, as with TenantWideQuery).
func parseParams[T any](raw json.RawMessage) (T, error) {
	var p T
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &p); err != nil {
			return p, fmt.Errorf("parsing parameters: %w", err)
		}
	}

	return p, nil
}

// registry maps the names the app asks for onto expressions. Adding a query the
// app can use means adding an entry here, a matching entry in querySchemas
// (schema_test.go, enforced by TestSchemaCoversRegistry) -- and nothing in the
// frontend.
var registry = map[string]namedQuery{
	// Ported from src/queries/probeExecutionStats.ts.
	"probe_execution_rate": {
		target: targetMetrics,
		build: func(raw json.RawMessage) (built, error) {
			if _, err := parseParams[TenantWideQuery](raw); err != nil {
				return built{}, err
			}

			return built{
				expr:    fmt.Sprintf(`sum(rate(probe_all_success_count[%s])) by (probe)`, defaultQueryFromTime),
				instant: true,
			}, nil
		},
	},

	// Ported from src/queries/uptime.ts.
	"checks_uptime": {
		target: targetMetrics,
		build: func(raw json.RawMessage) (built, error) {
			p, err := parseParams[CheckFrequencyQuery](raw)
			if err != nil {
				return built{}, err
			}

			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			interval, err := p.intervalFromFrequency()
			if err != nil {
				return built{}, err
			}

			return built{
				expr: fmt.Sprintf(
					`max by () (max_over_time(probe_success{job="%s", instance="%s", probe=~"%s"}[%s]))`,
					job, instance, probe, interval,
				),
				interval:      interval,
				maxDataPoints: 8000,
			}, nil
		},
	},
}

// resolve looks up a named query and builds it from the raw query JSON the
// frontend sent.
func resolve(name string, raw json.RawMessage) (namedQuery, built, error) {
	nq, ok := registry[name]
	if !ok {
		return namedQuery{}, built{}, fmt.Errorf("unknown query %q", name)
	}

	b, err := nq.build(raw)
	if err != nil {
		return namedQuery{}, built{}, fmt.Errorf("%s: %w", name, err)
	}

	return nq, b, nil
}

// names returns the registered query names, for diagnostics.
func names() []string {
	out := make([]string, 0, len(registry))
	for name := range registry {
		out = append(out, name)
	}

	return out
}
