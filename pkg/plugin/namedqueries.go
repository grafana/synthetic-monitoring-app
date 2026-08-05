package plugin

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// target names one of the datasources the SM datasource is linked to.
type target string

const (
	targetMetrics target = "metrics"
	targetLogs    target = "logs"
)

// defaultQueryFromTime mirrors DEFAULT_QUERY_FROM_TIME in components/constants.ts.
const defaultQueryFromTime = "3h"

// params are the arguments the app passes with a named query. Every named query
// draws from this one set; each validates what it actually needs.
//
// This is the whole API surface the app sees -- no expressions, no datasource
// uids, no query language.
type params struct {
	Job      string `json:"job"`
	Instance string `json:"instance"`
	Probe    string `json:"probe"`
	// Frequency is the check's frequency in milliseconds.
	Frequency int `json:"frequency"`
	// UnsuccessfulOnly restricts log queries to failed executions.
	UnsuccessfulOnly bool `json:"unsuccessfulOnly"`
	// Metric selects which series a query aggregates, where the query is generic
	// over metrics. Validated as a metric name, or against an allow-list.
	Metric string `json:"metric"`
	// Label is grouped on by the per-request breakdowns.
	Label string `json:"label"`
	// LabelName and LabelValue filter to a single request within a scripted check.
	LabelName  string `json:"labelName"`
	LabelValue string `json:"labelValue"`
	// Method is an HTTP method to filter on.
	Method string `json:"method"`
	// Quantile for quantile_over_time, 0-1.
	Quantile float64 `json:"quantile"`
	// By adds extra grouping labels on top of instance and job.
	By []string `json:"by"`
}

// probeOrAny defaults the probe matcher to "everything" so callers can omit it.
func (p params) probeOrAny() string {
	if p.Probe == "" {
		return ".*"
	}

	return p.Probe
}

// check requires the parameters every per-check query needs, and returns them
// escaped for use in label matchers.
func (p params) check() (job, instance, probe string, err error) {
	if p.Job == "" || p.Instance == "" {
		return "", "", "", fmt.Errorf("job and instance are required")
	}

	return escapeValue(p.Job), escapeValue(p.Instance), escapeValue(p.probeOrAny()), nil
}

// intervalFromFrequency renders the check frequency as a PromQL duration.
func (p params) intervalFromFrequency() (string, error) {
	if p.Frequency <= 0 {
		return "", fmt.Errorf("a positive frequency is required")
	}

	return fmt.Sprintf("%ds", p.Frequency/int(time.Second/time.Millisecond)), nil
}

// built is what a named query resolves to: an expression plus the execution
// options the backing datasource needs.
type built struct {
	expr          string
	instant       bool
	interval      string
	legendFormat  string
	maxDataPoints int64
}

// namedQuery is one entry in the registry.
type namedQuery struct {
	target target
	build  func(params) (built, error)
}

// registry maps the names the app asks for onto expressions. Adding a query the
// app can use means adding an entry here -- and nothing in the frontend.
//
// Each entry is ported from the frontend builder named in its comment. The
// expressions are written on one line where the original was indented across
// several; PromQL ignores whitespace outside string literals, and the tests pin
// each result so the port cannot drift.
var registry = map[string]namedQuery{
	// src/queries/uptime.ts
	"checks_uptime": {
		target: targetMetrics,
		build: func(p params) (built, error) {
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
				interval: interval,
				// in theory this could be 11,000 but it seems to error out at certain
				// time ranges? e.g. 21 days for 1m frequency
				maxDataPoints: 8000,
			}, nil
		},
	},

	// src/queries/reachability.ts
	"reachability": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			interval, err := p.intervalFromFrequency()
			if err != nil {
				return built{}, err
			}

			matcher := fmt.Sprintf(`instance="%s", job="%s", probe=~"%s"`, instance, job, probe)

			return built{
				expr: fmt.Sprintf(
					`sum(rate(probe_all_success_sum{%s}[$__rate_interval])) / sum(rate(probe_all_success_count{%s}[$__rate_interval]))`,
					matcher, matcher,
				),
				interval: interval,
			}, nil
		},
	},

	// src/queries/getCheckConfigsQuery.ts
	"check_configs": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			return built{
				expr: fmt.Sprintf(
					`group by(frequency, config_version) (max_over_time(sm_check_info{job="%s", instance="%s", probe=~"%s"}[$__range]))`,
					job, instance, probe,
				),
				instant: true,
			}, nil
		},
	},

	// src/queries/getCheckProbeMaxDuration.ts
	"check_probe_max_duration": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			return built{
				expr: fmt.Sprintf(
					`max by(job, instance, probe) (max_over_time(probe_duration_seconds{job="%s", instance="%s", probe=~"%s"}[$__range]))`,
					job, instance, probe,
				),
				instant: true,
			}, nil
		},
	},

	// src/queries/getCheckProbeAvgDuration.ts -- deliberately not filtered by probe
	"check_probe_avg_duration": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, _, err := p.check()
			if err != nil {
				return built{}, err
			}

			return built{
				expr:    fmt.Sprintf(`avg by() (probe_duration_seconds{job="%s", instance="%s"})`, job, instance),
				instant: true,
			}, nil
		},
	},

	// src/queries/probeExecutionStats.ts -- tenant-wide, so no check parameters
	"probe_execution_rate": {
		target: targetMetrics,
		build: func(params) (built, error) {
			return built{
				expr:    fmt.Sprintf(`sum(rate(probe_all_success_count[%s])) by (probe)`, defaultQueryFromTime),
				instant: true,
			}, nil
		},
	},

	// src/queries/probeExecutionStats.ts
	"probe_failure_rate": {
		target: targetMetrics,
		build: func(params) (built, error) {
			return built{
				expr: fmt.Sprintf(
					`clamp_min(sum(rate(probe_all_success_count[%s])) by (probe) - sum(rate(probe_all_success_sum[%s])) by (probe), 0)`,
					defaultQueryFromTime, defaultQueryFromTime,
				),
				instant: true,
			}, nil
		},
	},

	// src/queries/sumDurationByProbe.ts
	"sum_duration_by_probe": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			metric, err := validMetric(p.Metric)
			if err != nil {
				return built{}, err
			}

			return built{
				expr: fmt.Sprintf(
					`sum by (probe) (%s{probe=~"%s", job="%s", instance="%s"})`,
					metric, probe, job, instance,
				),
				legendFormat: "__auto",
			}, nil
		},
	},

	// src/queries/countDistinctTargets.ts
	"count_distinct_targets": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			metric, err := validMetric(p.Metric)
			if err != nil {
				return built{}, err
			}

			return built{
				expr: fmt.Sprintf(
					`count by (job, target) (count by (url) (%s{probe=~"%s", job="%s", instance="%s"}))`,
					metric, probe, job, instance,
				),
				instant:      true,
				legendFormat: "__auto",
			}, nil
		},
	},

	// src/queries/browserDataReceived.ts
	"browser_data_received": {
		target: targetMetrics,
		build:  sumByProbe("probe_browser_data_received"),
	},

	// src/queries/browserDataSent.ts
	"browser_data_sent": {
		target: targetMetrics,
		build:  sumByProbe("probe_browser_data_sent"),
	},

	// src/queries/scriptedDataReceived.ts
	"scripted_data_received": {
		target: targetMetrics,
		build:  seriesByProbe("probe_data_received_bytes"),
	},

	// src/queries/scriptedDataSent.ts
	"scripted_data_sent": {
		target: targetMetrics,
		build:  seriesByProbe("probe_data_sent_bytes"),
	},

	// src/queries/avgQuantileWebVital.ts
	"avg_quantile_web_vital": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			// the frontend restricted this to a union of six metrics; keep that rather
			// than accepting any metric name
			metric, err := oneOf("web vital metric", p.Metric,
				"probe_browser_web_vital_fcp",
				"probe_browser_web_vital_lcp",
				"probe_browser_web_vital_ttfb",
				"probe_browser_web_vital_cls",
				"probe_browser_web_vital_fid",
				"probe_browser_web_vital_inp",
			)
			if err != nil {
				return built{}, err
			}

			quantile := p.Quantile
			if quantile == 0 {
				quantile = 0.75
			}
			if quantile < 0 || quantile > 1 {
				return built{}, fmt.Errorf("quantile must be between 0 and 1, got %v", quantile)
			}

			by, err := validLabels(p.By)
			if err != nil {
				return built{}, err
			}
			groupBy := strings.Join(append([]string{"instance", "job"}, by...), ",")

			return built{
				expr: fmt.Sprintf(
					`avg by (%s) (quantile_over_time(%v, %s{instance="%s", job="%s", probe=~"%s"}[$__range]))`,
					groupBy, quantile, metric, instance, job, probe,
				),
			}, nil
		},
	},

	// src/queries/avgRequestLatency.ts
	"avg_request_latency": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, label, err := p.requestBreakdown()
			if err != nil {
				return built{}, err
			}

			return built{
				expr: fmt.Sprintf(
					`avg_over_time( ( sum by (%s, method)(probe_http_duration_seconds{job="%s", instance="%s", probe=~"%s"}) )[$__range:] )`,
					label, job, instance, probe,
				),
				instant: true,
			}, nil
		},
	},

	// src/queries/avgRequestSuccessRate.ts
	"avg_request_success_rate": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, label, err := p.requestBreakdown()
			if err != nil {
				return built{}, err
			}

			matcher := fmt.Sprintf(`job="%s", instance="%s", probe=~"%s"`, job, instance, probe)

			return built{
				expr: fmt.Sprintf(
					`avg_over_time( ( sum by (%s, method) (probe_http_requests_failed_total{%s}) / sum by (%s, method) (probe_http_requests_total{%s}) )[$__range:] )`,
					label, matcher, label, matcher,
				),
				instant: true,
			}, nil
		},
	},

	// src/queries/avgRequestExpectedResponse.ts
	"avg_request_expected_response": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, label, err := p.requestBreakdown()
			if err != nil {
				return built{}, err
			}

			matcher := fmt.Sprintf(`job="%s", instance="%s", probe=~"%s"`, job, instance, probe)

			return built{
				expr: fmt.Sprintf(
					`avg_over_time( ( sum by (%s, method) (probe_http_got_expected_response{%s}) / count by (%s, method)(probe_http_got_expected_response{%s}) )[$__range:] )`,
					label, matcher, label, matcher,
				),
				instant: true,
			}, nil
		},
	},

	// src/queries/scriptedHTTPRequestsErrorRate.ts
	"scripted_http_requests_error_rate": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			labelName, err := validLabel(p.LabelName)
			if err != nil {
				return built{}, err
			}

			if p.LabelValue == "" || p.Method == "" {
				return built{}, fmt.Errorf("labelValue and method are required")
			}

			matcher := fmt.Sprintf(
				`instance="%s", job="%s", probe=~"%s", %s="%s", method="%s"`,
				instance, job, probe, labelName, escapeValue(p.LabelValue), escapeValue(p.Method),
			)

			return built{
				expr: fmt.Sprintf(
					`sum by (probe, method) ( probe_http_requests_failed_total{%s} ) / sum by (probe, method) ( probe_http_requests_total{%s} )`,
					matcher, matcher,
				),
			}, nil
		},
	},

	// src/scenes/Common/ErrorLogsPanel.tsx
	"check_error_logs": {
		target: targetLogs,
		build: func(p params) (built, error) {
			job, instance, probe, err := p.check()
			if err != nil {
				return built{}, err
			}

			success := ".*"
			if p.UnsuccessfulOnly {
				success = "0"
			}

			return built{
				expr: fmt.Sprintf(
					`{probe=~"%s", instance="%s", job="%s", probe_success=~"%s"} | logfmt`,
					probe, instance, job, success,
				),
			}, nil
		},
	},
}

// requestBreakdown validates the parameters the per-request HTTP breakdowns share.
func (p params) requestBreakdown() (job, instance, probe, label string, err error) {
	job, instance, probe, err = p.check()
	if err != nil {
		return "", "", "", "", err
	}

	label, err = validLabel(p.Label)
	if err != nil {
		return "", "", "", "", err
	}

	return job, instance, probe, label, nil
}

// sumByProbe builds the browser data queries, which differ only by metric.
func sumByProbe(metric string) func(params) (built, error) {
	return func(p params) (built, error) {
		job, instance, probe, err := p.check()
		if err != nil {
			return built{}, err
		}

		return built{
			expr: fmt.Sprintf(
				`sum by (probe) (%s{probe=~"%s", job="%s", instance="%s"})`,
				metric, probe, job, instance,
			),
			legendFormat: "{{ probe }}",
		}, nil
	}
}

// seriesByProbe builds the scripted data queries, which return raw series.
func seriesByProbe(metric string) func(params) (built, error) {
	return func(p params) (built, error) {
		job, instance, probe, err := p.check()
		if err != nil {
			return built{}, err
		}

		return built{
			expr:         fmt.Sprintf(`%s{probe=~"%s", job="%s", instance="%s"}`, metric, probe, job, instance),
			legendFormat: "{{ probe }}",
		}, nil
	}
}

// resolve looks up a named query and builds it from the raw query JSON the
// frontend sent.
func resolve(name string, raw json.RawMessage) (namedQuery, built, error) {
	nq, ok := registry[name]
	if !ok {
		return namedQuery{}, built{}, fmt.Errorf("unknown query %q", name)
	}

	var p params
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &p); err != nil {
			return namedQuery{}, built{}, fmt.Errorf("parsing parameters for %q: %w", name, err)
		}
	}

	b, err := nq.build(p)
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
