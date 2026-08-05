package plugin

import (
	"fmt"
	"regexp"
	"strings"
)

// A named query takes parameters from whoever calls /api/ds/query, and several of
// them end up inside the expression. That makes this a trust boundary the frontend
// never was: without checking, a caller could pass a metric name of
// `up} or secret_metric{` and get arbitrary PromQL executed, which would make the
// whole idea of serving queries by name decorative.
//
// Values (label matchers) are escaped; identifiers (metric and label names) are
// validated against Prometheus's grammar, and restricted to an allow-list wherever
// the frontend had a fixed set to begin with.
var (
	// https://prometheus.io/docs/concepts/data_model/ -- metric names may contain colons
	metricNamePattern = regexp.MustCompile(`^[a-zA-Z_:][a-zA-Z0-9_:]*$`)
	labelNamePattern  = regexp.MustCompile(`^[a-zA-Z_][a-zA-Z0-9_]*$`)
)

// validMetric returns the metric name unchanged, or an error if it is not one.
func validMetric(name string) (string, error) {
	if !metricNamePattern.MatchString(name) {
		return "", fmt.Errorf("%q is not a valid metric name", name)
	}

	return name, nil
}

// validLabel returns the label name unchanged, or an error if it is not one.
func validLabel(name string) (string, error) {
	if !labelNamePattern.MatchString(name) {
		return "", fmt.Errorf("%q is not a valid label name", name)
	}

	return name, nil
}

// validLabels validates a list of label names, for `by (...)` clauses.
func validLabels(names []string) ([]string, error) {
	out := make([]string, 0, len(names))

	for _, name := range names {
		valid, err := validLabel(name)
		if err != nil {
			return nil, err
		}
		out = append(out, valid)
	}

	return out, nil
}

// oneOf restricts a parameter to a fixed set, for cases where the frontend had a
// union type. Preferred over pattern matching: it cannot be outgrown by accident.
func oneOf(what, value string, allowed ...string) (string, error) {
	for _, candidate := range allowed {
		if value == candidate {
			return value, nil
		}
	}

	return "", fmt.Errorf("%q is not a supported %s (want one of: %s)", value, what, strings.Join(allowed, ", "))
}

// escapeValue escapes a string for use inside a PromQL label matcher.
//
// The frontend interpolated these raw, so a job name containing a double quote
// produced a broken query there. Here it would additionally let a caller escape
// the matcher, so this both fixes that and closes the hole.
func escapeValue(value string) string {
	var b strings.Builder
	b.Grow(len(value))

	for _, r := range value {
		switch r {
		case '\\':
			b.WriteString(`\\`)
		case '"':
			b.WriteString(`\"`)
		case '\n':
			b.WriteString(`\n`)
		default:
			b.WriteRune(r)
		}
	}

	return b.String()
}
