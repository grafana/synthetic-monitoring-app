package plugin

import (
	"fmt"
	"time"
)

// queryshapes.go replaces the single shared `params` struct namedqueries.go
// used to have with one type per real parameter shape, so both Go callers and
// the generated schema (schema_test.go) see what a query actually needs
// instead of the same 12 optional fields for all 19.
//
// Each of the 19 registry entries in namedqueries.go was read to determine
// which fields it actually touches; every entry maps onto exactly one of
// these 8 shapes.

// TenantWideQuery has no parameters: the query is computed across the whole
// tenant. Matches "probe_execution_rate", "probe_failure_rate".
type TenantWideQuery struct{}

// CheckQuery identifies a single check. It is the base every other
// non-tenant-wide shape builds on. Matches "check_configs",
// "check_probe_max_duration", "check_probe_avg_duration",
// "browser_data_received", "browser_data_sent", "scripted_data_received",
// "scripted_data_sent".
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
// used to size a lookback window. Matches "checks_uptime", "reachability".
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

// CheckMetricQuery is a CheckQuery plus the metric series to aggregate, for
// queries generic over which probe_* metric they read. Matches
// "sum_duration_by_probe", "count_distinct_targets".
type CheckMetricQuery struct {
	CheckQuery
	// Metric is the Prometheus metric name to aggregate, validated against an
	// allow-list.
	Metric string `json:"metric"`
}

// CheckLabelQuery is a CheckQuery plus the label to break results out by, for
// the per-request HTTP breakdown panels. Matches "avg_request_latency",
// "avg_request_success_rate", "avg_request_expected_response".
type CheckLabelQuery struct {
	CheckQuery
	// Label is grouped on in addition to method.
	Label string `json:"label"`
}

// requestBreakdown validates the parameters the per-request HTTP breakdowns share.
func (q CheckLabelQuery) requestBreakdown() (job, instance, probe, label string, err error) {
	job, instance, probe, err = q.check()
	if err != nil {
		return "", "", "", "", err
	}

	label, err = validLabel(q.Label)
	if err != nil {
		return "", "", "", "", err
	}

	return job, instance, probe, label, nil
}

// CheckLabelMatchQuery is a CheckQuery plus a single label/value/method
// filter, for isolating one request within a scripted check. Matches
// "scripted_http_requests_error_rate".
type CheckLabelMatchQuery struct {
	CheckQuery
	// LabelName is the label to filter on.
	LabelName string `json:"labelName"`
	// LabelValue is the required value of LabelName.
	LabelValue string `json:"labelValue"`
	// Method is the HTTP method to filter on.
	Method string `json:"method"`
}

// CheckLogsQuery is a CheckQuery plus a log-filtering flag. Matches
// "check_error_logs".
type CheckLogsQuery struct {
	CheckQuery
	// UnsuccessfulOnly restricts results to failed executions.
	UnsuccessfulOnly bool `json:"unsuccessfulOnly,omitempty"`
}

// WebVitalMetric is one of the six Core Web Vitals metrics this query
// accepts. Unlike CheckMetricQuery.Metric, the frontend restricts this to a
// fixed union rather than an open allow-list.
// +enum
type WebVitalMetric string

const (
	// First Contentful Paint
	WebVitalFCP WebVitalMetric = "probe_browser_web_vital_fcp"
	// Largest Contentful Paint
	WebVitalLCP WebVitalMetric = "probe_browser_web_vital_lcp"
	// Time To First Byte
	WebVitalTTFB WebVitalMetric = "probe_browser_web_vital_ttfb"
	// Cumulative Layout Shift
	WebVitalCLS WebVitalMetric = "probe_browser_web_vital_cls"
	// First Input Delay
	WebVitalFID WebVitalMetric = "probe_browser_web_vital_fid"
	// Interaction to Next Paint
	WebVitalINP WebVitalMetric = "probe_browser_web_vital_inp"
)

// CheckWebVitalQuery is a CheckQuery plus a web vital metric, quantile, and
// extra grouping labels. Matches "avg_quantile_web_vital" -- the one query
// that doesn't fit any other shape.
type CheckWebVitalQuery struct {
	CheckQuery
	// Metric is one of the six Core Web Vitals metrics.
	Metric WebVitalMetric `json:"metric"`
	// Quantile for quantile_over_time, between 0 and 1. Defaults to 0.75.
	Quantile float64 `json:"quantile,omitempty"`
	// By adds extra grouping labels on top of instance and job.
	By []string `json:"by,omitempty"`
}
