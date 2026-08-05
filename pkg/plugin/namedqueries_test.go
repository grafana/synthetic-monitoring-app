package plugin

import (
	"encoding/json"
	"strings"
	"testing"
)

// Each expected expression below is the output of the frontend builder named in
// the case, with the same inputs. If either side changes, this fails rather than
// the app quietly asking for something different than it used to.
//
// Where the frontend built the expression across several indented lines it is
// written on one line here; PromQL ignores whitespace outside string literals.
func TestRegistryExpressions(t *testing.T) {
	tests := []struct {
		name      string
		query     string
		params    string
		expr      string
		target    target
		instant   bool
		interval  string
		legend    string
		maxPoints int64
	}{
		{
			// src/queries/uptime.ts
			name:      "checks_uptime",
			query:     "checks_uptime",
			params:    `{"job":"my job","instance":"https://grafana.com","frequency":60000}`,
			expr:      `max by () (max_over_time(probe_success{job="my job", instance="https://grafana.com", probe=~".*"}[60s]))`,
			target:    targetMetrics,
			interval:  "60s",
			maxPoints: 8000,
		},
		{
			name:      "checks_uptime with a probe filter",
			query:     "checks_uptime",
			params:    `{"job":"j","instance":"i","probe":"Frankfurt|London","frequency":10000}`,
			expr:      `max by () (max_over_time(probe_success{job="j", instance="i", probe=~"Frankfurt|London"}[10s]))`,
			target:    targetMetrics,
			interval:  "10s",
			maxPoints: 8000,
		},
		{
			// src/queries/reachability.ts
			name:     "reachability",
			query:    "reachability",
			params:   `{"job":"j","instance":"i","frequency":30000}`,
			expr:     `sum(rate(probe_all_success_sum{instance="i", job="j", probe=~".*"}[$__rate_interval])) / sum(rate(probe_all_success_count{instance="i", job="j", probe=~".*"}[$__rate_interval]))`,
			target:   targetMetrics,
			interval: "30s",
		},
		{
			// src/queries/getCheckConfigsQuery.ts
			name:    "check_configs",
			query:   "check_configs",
			params:  `{"job":"j","instance":"i"}`,
			expr:    `group by(frequency, config_version) (max_over_time(sm_check_info{job="j", instance="i", probe=~".*"}[$__range]))`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/getCheckProbeMaxDuration.ts
			name:    "check_probe_max_duration",
			query:   "check_probe_max_duration",
			params:  `{"job":"j","instance":"i","probe":"Oregon"}`,
			expr:    `max by(job, instance, probe) (max_over_time(probe_duration_seconds{job="j", instance="i", probe=~"Oregon"}[$__range]))`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/getCheckProbeAvgDuration.ts -- no probe matcher, by design
			name:    "check_probe_avg_duration",
			query:   "check_probe_avg_duration",
			params:  `{"job":"j","instance":"i","probe":"ignored"}`,
			expr:    `avg by() (probe_duration_seconds{job="j", instance="i"})`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/probeExecutionStats.ts
			name:    "probe_execution_rate",
			query:   "probe_execution_rate",
			params:  `{}`,
			expr:    `sum(rate(probe_all_success_count[3h])) by (probe)`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/probeExecutionStats.ts
			name:    "probe_failure_rate",
			query:   "probe_failure_rate",
			params:  `{}`,
			expr:    `clamp_min(sum(rate(probe_all_success_count[3h])) by (probe) - sum(rate(probe_all_success_sum[3h])) by (probe), 0)`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/sumDurationByProbe.ts
			name:   "sum_duration_by_probe",
			query:  "sum_duration_by_probe",
			params: `{"job":"j","instance":"i","metric":"probe_http_duration_seconds"}`,
			expr:   `sum by (probe) (probe_http_duration_seconds{probe=~".*", job="j", instance="i"})`,
			target: targetMetrics,
			legend: "__auto",
		},
		{
			// src/queries/countDistinctTargets.ts
			name:    "count_distinct_targets",
			query:   "count_distinct_targets",
			params:  `{"job":"j","instance":"i","metric":"probe_browser_http_req_duration"}`,
			expr:    `count by (job, target) (count by (url) (probe_browser_http_req_duration{probe=~".*", job="j", instance="i"}))`,
			target:  targetMetrics,
			instant: true,
			legend:  "__auto",
		},
		{
			// src/queries/browserDataReceived.ts
			name:   "browser_data_received",
			query:  "browser_data_received",
			params: `{"job":"j","instance":"i"}`,
			expr:   `sum by (probe) (probe_browser_data_received{probe=~".*", job="j", instance="i"})`,
			target: targetMetrics,
			legend: "{{ probe }}",
		},
		{
			// src/queries/browserDataSent.ts
			name:   "browser_data_sent",
			query:  "browser_data_sent",
			params: `{"job":"j","instance":"i"}`,
			expr:   `sum by (probe) (probe_browser_data_sent{probe=~".*", job="j", instance="i"})`,
			target: targetMetrics,
			legend: "{{ probe }}",
		},
		{
			// src/queries/scriptedDataReceived.ts
			name:   "scripted_data_received",
			query:  "scripted_data_received",
			params: `{"job":"j","instance":"i"}`,
			expr:   `probe_data_received_bytes{probe=~".*", job="j", instance="i"}`,
			target: targetMetrics,
			legend: "{{ probe }}",
		},
		{
			// src/queries/scriptedDataSent.ts
			name:   "scripted_data_sent",
			query:  "scripted_data_sent",
			params: `{"job":"j","instance":"i"}`,
			expr:   `probe_data_sent_bytes{probe=~".*", job="j", instance="i"}`,
			target: targetMetrics,
			legend: "{{ probe }}",
		},
		{
			// src/queries/avgQuantileWebVital.ts -- default quantile
			name:   "avg_quantile_web_vital",
			query:  "avg_quantile_web_vital",
			params: `{"job":"j","instance":"i","metric":"probe_browser_web_vital_lcp"}`,
			expr:   `avg by (instance,job) (quantile_over_time(0.75, probe_browser_web_vital_lcp{instance="i", job="j", probe=~".*"}[$__range]))`,
			target: targetMetrics,
		},
		{
			// src/queries/avgQuantileWebVital.ts -- extra grouping and explicit quantile
			name:   "avg_quantile_web_vital grouped by url",
			query:  "avg_quantile_web_vital",
			params: `{"job":"j","instance":"i","metric":"probe_browser_web_vital_cls","quantile":0.9,"by":["url"]}`,
			expr:   `avg by (instance,job,url) (quantile_over_time(0.9, probe_browser_web_vital_cls{instance="i", job="j", probe=~".*"}[$__range]))`,
			target: targetMetrics,
		},
		{
			// src/queries/avgRequestLatency.ts
			name:    "avg_request_latency",
			query:   "avg_request_latency",
			params:  `{"job":"j","instance":"i","label":"name"}`,
			expr:    `avg_over_time( ( sum by (name, method)(probe_http_duration_seconds{job="j", instance="i", probe=~".*"}) )[$__range:] )`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/avgRequestSuccessRate.ts
			name:    "avg_request_success_rate",
			query:   "avg_request_success_rate",
			params:  `{"job":"j","instance":"i","label":"name"}`,
			expr:    `avg_over_time( ( sum by (name, method) (probe_http_requests_failed_total{job="j", instance="i", probe=~".*"}) / sum by (name, method) (probe_http_requests_total{job="j", instance="i", probe=~".*"}) )[$__range:] )`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/avgRequestExpectedResponse.ts
			name:    "avg_request_expected_response",
			query:   "avg_request_expected_response",
			params:  `{"job":"j","instance":"i","label":"name"}`,
			expr:    `avg_over_time( ( sum by (name, method) (probe_http_got_expected_response{job="j", instance="i", probe=~".*"}) / count by (name, method)(probe_http_got_expected_response{job="j", instance="i", probe=~".*"}) )[$__range:] )`,
			target:  targetMetrics,
			instant: true,
		},
		{
			// src/queries/scriptedHTTPRequestsErrorRate.ts
			name:   "scripted_http_requests_error_rate",
			query:  "scripted_http_requests_error_rate",
			params: `{"job":"j","instance":"i","labelName":"name","labelValue":"my request","method":"GET"}`,
			expr:   `sum by (probe, method) ( probe_http_requests_failed_total{instance="i", job="j", probe=~".*", name="my request", method="GET"} ) / sum by (probe, method) ( probe_http_requests_total{instance="i", job="j", probe=~".*", name="my request", method="GET"} )`,
			target: targetMetrics,
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
			if b.instant != tt.instant {
				t.Errorf("instant = %v, want %v", b.instant, tt.instant)
			}
			if b.interval != tt.interval {
				t.Errorf("interval = %q, want %q", b.interval, tt.interval)
			}
			if b.legendFormat != tt.legend {
				t.Errorf("legendFormat = %q, want %q", b.legendFormat, tt.legend)
			}
			if b.maxDataPoints != tt.maxPoints {
				t.Errorf("maxDataPoints = %d, want %d", b.maxDataPoints, tt.maxPoints)
			}
		})
	}

	// every registered query must be covered above, so adding one without a test
	// fails rather than shipping unverified
	covered := map[string]bool{}
	for _, tt := range tests {
		covered[tt.query] = true
	}
	for _, name := range names() {
		if !covered[name] {
			t.Errorf("query %q is registered but has no expression test", name)
		}
	}
}

func TestResolveRejectsBadInput(t *testing.T) {
	tests := []struct {
		name   string
		query  string
		params string
		want   string
	}{
		{"unknown query name", "checks_downtime", `{"job":"j","instance":"i","frequency":1000}`, `unknown query`},
		{"missing job", "checks_uptime", `{"instance":"i","frequency":1000}`, `job and instance are required`},
		{"missing instance", "checks_uptime", `{"job":"j","frequency":1000}`, `job and instance are required`},
		{"missing frequency", "checks_uptime", `{"job":"j","instance":"i"}`, `positive frequency`},
		{"logs missing instance", "check_error_logs", `{"job":"j"}`, `job and instance are required`},
		{"missing label", "avg_request_latency", `{"job":"j","instance":"i"}`, `not a valid label name`},
		{"missing metric", "sum_duration_by_probe", `{"job":"j","instance":"i"}`, `not a valid metric name`},
		{"labelValue and method required", "scripted_http_requests_error_rate",
			`{"job":"j","instance":"i","labelName":"name"}`, `labelValue and method are required`},
		{"quantile out of range", "avg_quantile_web_vital",
			`{"job":"j","instance":"i","metric":"probe_browser_web_vital_lcp","quantile":2}`, `between 0 and 1`},
		{"web vital metric not on the allow-list", "avg_quantile_web_vital",
			`{"job":"j","instance":"i","metric":"probe_success"}`, `not a supported web vital metric`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := resolve(tt.query, json.RawMessage(tt.params))
			if err == nil {
				t.Fatalf("expected an error containing %q", tt.want)
			}
			if !strings.Contains(err.Error(), tt.want) {
				t.Errorf("error = %q, want it to contain %q", err, tt.want)
			}
		})
	}
}

// A named query takes its parameters from the request body, so anything spliced
// into the expression is untrusted. Identifiers are validated and values escaped;
// without that, a caller could execute PromQL of their choosing.
func TestParametersCannotInjectPromQL(t *testing.T) {
	t.Run("metric names are rejected, not escaped", func(t *testing.T) {
		for _, bad := range []string{
			`up} or secret_metric{`,
			`up offset 1h`,
			`probe_success{job="other"}`,
			`probe success`,
			``,
		} {
			_, _, err := resolve("sum_duration_by_probe",
				json.RawMessage(`{"job":"j","instance":"i","metric":`+quote(bad)+`}`))
			if err == nil {
				t.Errorf("metric %q was accepted", bad)
			}
		}
	})

	t.Run("label names are rejected, not escaped", func(t *testing.T) {
		for _, bad := range []string{`name) (up) by (name`, `name="x"`, `na-me`, ``} {
			_, _, err := resolve("avg_request_latency",
				json.RawMessage(`{"job":"j","instance":"i","label":`+quote(bad)+`}`))
			if err == nil {
				t.Errorf("label %q was accepted", bad)
			}
		}
	})

	t.Run("grouping labels are validated", func(t *testing.T) {
		_, _, err := resolve("avg_quantile_web_vital",
			json.RawMessage(`{"job":"j","instance":"i","metric":"probe_browser_web_vital_lcp","by":["url) (up"]}`))
		if err == nil {
			t.Error("an invalid grouping label was accepted")
		}
	})

	t.Run("values are escaped so they cannot leave the matcher", func(t *testing.T) {
		// a job name containing a quote would otherwise close the matcher early and
		// let the rest of the value become query syntax
		_, b, err := resolve("check_probe_avg_duration",
			json.RawMessage(`{"job":"j\" or up{a=\"b","instance":"i"}`))
		if err != nil {
			t.Fatalf("resolve: %v", err)
		}

		want := `avg by() (probe_duration_seconds{job="j\" or up{a=\"b", instance="i"})`
		if b.expr != want {
			t.Errorf("expr = %s\nwant %s", b.expr, want)
		}
	})

	t.Run("backslashes are escaped", func(t *testing.T) {
		_, b, err := resolve("check_probe_avg_duration", json.RawMessage(`{"job":"a\\b","instance":"i"}`))
		if err != nil {
			t.Fatalf("resolve: %v", err)
		}
		if !strings.Contains(b.expr, `job="a\\b"`) {
			t.Errorf("backslash not escaped: %s", b.expr)
		}
	})
}

// quote renders a Go string as a JSON string literal.
func quote(s string) string {
	out, err := json.Marshal(s)
	if err != nil {
		panic(err)
	}

	return string(out)
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
