package plugin

import (
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
		return "", "", "", fmt.Errorf("job and instance are required")
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
		return "", fmt.Errorf("a positive frequency is required")
	}

	return fmt.Sprintf("%ds", q.Frequency/int(time.Second/time.Millisecond)), nil
}
