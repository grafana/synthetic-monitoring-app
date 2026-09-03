package plugin

import "strings"

// A named query takes parameters from whoever calls /api/ds/query, and some of
// them end up inside a PromQL label matcher. That makes this a trust boundary
// the frontend never was: without escaping, a job name containing a double quote
// could break out of the matcher.
//
// escapeValue escapes a string for use inside a PromQL label matcher.
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
