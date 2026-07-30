package plugin

import (
	"encoding/json"
	"fmt"
	"time"
)

// target names one of the datasources the SM datasource is linked to.
type target string

const (
	targetMetrics target = "metrics"
	targetLogs    target = "logs"
)

// params are the arguments the app passes with a named query. Every named query
// draws from this one set; each validates what it actually needs.
//
// This is the whole API surface the app sees -- no expressions, no datasource
// uids, no query language.
type params struct {
	Job              string `json:"job"`
	Instance         string `json:"instance"`
	Probe            string `json:"probe"`
	Frequency        int    `json:"frequency"`
	UnsuccessfulOnly bool   `json:"unsuccessfulOnly"`
}

// probeOrAny defaults the probe matcher to "everything" so callers can omit it.
func (p params) probeOrAny() string {
	if p.Probe == "" {
		return ".*"
	}

	return p.Probe
}

// built is what a named query resolves to: an expression plus the execution
// options the backing datasource needs.
type built struct {
	expr          string
	instant       bool
	interval      string
	maxDataPoints int64
}

// namedQuery is one entry in the registry.
type namedQuery struct {
	target target
	build  func(params) (built, error)
}

// registry maps the names the app asks for onto expressions. Adding a query the
// app can use means adding an entry here -- and nothing in the frontend.
var registry = map[string]namedQuery{
	// Ported from src/queries/uptime.ts. `frequency` is the check's frequency in
	// milliseconds; the range selector and the step both derive from it.
	"checks_uptime": {
		target: targetMetrics,
		build: func(p params) (built, error) {
			if p.Job == "" || p.Instance == "" {
				return built{}, fmt.Errorf("checks_uptime requires job and instance")
			}
			if p.Frequency <= 0 {
				return built{}, fmt.Errorf("checks_uptime requires a positive frequency")
			}

			interval := fmt.Sprintf("%ds", p.Frequency/int(time.Second/time.Millisecond))

			return built{
				expr: fmt.Sprintf(
					`max by () (max_over_time(probe_success{job="%s", instance="%s", probe=~"%s"}[%s]))`,
					p.Job, p.Instance, p.probeOrAny(), interval,
				),
				interval: interval,
				// in theory this could be 11,000 but it seems to error out at certain
				// time ranges? e.g. 21 days for 1m frequency
				maxDataPoints: 8000,
			}, nil
		},
	},

	// Ported from src/scenes/Common/ErrorLogsPanel.tsx.
	"check_error_logs": {
		target: targetLogs,
		build: func(p params) (built, error) {
			if p.Job == "" || p.Instance == "" {
				return built{}, fmt.Errorf("check_error_logs requires job and instance")
			}

			success := ".*"
			if p.UnsuccessfulOnly {
				success = "0"
			}

			return built{
				expr: fmt.Sprintf(
					`{probe=~"%s", instance="%s", job="%s", probe_success=~"%s"} | logfmt`,
					p.probeOrAny(), p.Instance, p.Job, success,
				),
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

	var p params
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &p); err != nil {
			return namedQuery{}, built{}, fmt.Errorf("parsing parameters for %q: %w", name, err)
		}
	}

	b, err := nq.build(p)
	if err != nil {
		return namedQuery{}, built{}, err
	}

	return nq, b, nil
}
