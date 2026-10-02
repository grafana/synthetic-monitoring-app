package plugin

import (
	"errors"
	"fmt"
	"time"
)

// queryshapes.go gives each named query its own parameter type instead of one
// struct shared by every entry in the registry, so both Go callers and the
// generated schema (schema_test.go) see what a query actually needs.
//
// See the schema generated on `mem/proxy-datasources` for the fuller set this
// is expected to grow into as more queries are ported.

// TenantWideQuery has no parameters: the query is computed across the whole
// tenant. Matches "probe_execution_rate".
type TenantWideQuery struct{}

// CheckQuery identifies a single check. It is the base every other per-check
// shape builds on. Matches "checks_uptime" (via CheckFrequencyQuery).
type CheckQuery struct {
	// Job is the check's job label.
	Job string `json:"job"`
	// Instance is the check's instance label.
	Instance string `json:"instance"`
	// Probe restricts results to a single probe. Empty matches every probe.
	Probe string `json:"probe,omitempty"`
}

// probeOrAny defaults the probe matcher to "everything" so callers can omit it.
func (q CheckQuery) probeOrAny() string {
	if q.Probe == "" {
		return ".*"
	}

	return q.Probe
}

// check requires the parameters every per-check query needs, and returns them
// escaped for use in label matchers.
func (q CheckQuery) check() (job, instance, probe string, err error) {
	if q.Job == "" || q.Instance == "" {
		return "", "", "", errors.New("job and instance are required")
	}

	return escapeValue(q.Job), escapeValue(q.Instance), escapeValue(q.probeOrAny()), nil
}

// CheckFrequencyQuery is a CheckQuery plus the check's execution frequency,
// used to size a lookback window. Matches "checks_uptime".
type CheckFrequencyQuery struct {
	CheckQuery
	// Frequency is the check's frequency in milliseconds. Must be positive.
	Frequency int `json:"frequency"`
}

// intervalFromFrequency renders the check frequency as a PromQL duration.
func (q CheckFrequencyQuery) intervalFromFrequency() (string, error) {
	if q.Frequency <= 0 {
		return "", errors.New("a positive frequency is required")
	}

	return fmt.Sprintf("%ds", q.Frequency/int(time.Second/time.Millisecond)), nil
}

// checkTypes is the closed set of check types the app's CheckType enum
// (src/types.ts) defines. CheckTypeQuery.CheckType selects a metric name, not
// a label value, so it is validated against this set rather than escaped.
var checkTypes = map[string]bool{
	"browser":    true,
	"dns":        true,
	"grpc":       true,
	"http":       true,
	"multihttp":  true,
	"ping":       true,
	"scripted":   true,
	"tcp":        true,
	"traceroute": true,
}

// CheckTypeQuery carries a check type, mirroring the app's own
// getQuery(job, target, type) signature (src/data/useLatency.ts). Matches
// "checks_latency".
type CheckTypeQuery struct {
	// CheckType is one of the app's CheckType enum values (src/types.ts),
	// lowercase, e.g. "http" or "scripted".
	CheckType string `json:"checkType"`
}

// latencyMetric identifies which Prometheus metric family measures a check
// type's latency. Scripted and MultiHttp checks execute via k6 and emit
// probe_http_total_duration_seconds; every other check type uses the
// blackbox-exporter-style probe_all_duration_seconds / probe_duration_seconds
// fallback -- see src/data/useLatency.ts (getQuery).
type latencyMetric int

const (
	latencyMetricNetwork  latencyMetric = iota // probe_all_duration_seconds / probe_duration_seconds fallback
	latencyMetricScripted                      // probe_http_total_duration_seconds
)

// latencyMetric reports which metric family this check type's latency comes
// from.
func (q CheckTypeQuery) latencyMetric() (latencyMetric, error) {
	if !checkTypes[q.CheckType] {
		return 0, fmt.Errorf("unknown check type %q", q.CheckType)
	}

	if q.CheckType == "multihttp" || q.CheckType == "scripted" {
		return latencyMetricScripted, nil
	}

	return latencyMetricNetwork, nil
}
