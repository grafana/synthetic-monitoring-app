package plugin

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
)

// namedQuerySchema describes one registry entry for schema generation. This
// mirrors registry in namedqueries.go by hand for now -- see the package
// comment in queryshapes.go for why, and TestSchemaCoversRegistry below for
// the safety net that keeps the two from silently drifting apart.
type namedQuerySchema struct {
	description string
	goType      reflect.Type
}

var querySchemas = map[string]namedQuerySchema{
	"probe_execution_rate": {
		description: "Rate of successful check executions per probe, summed across all checks in the tenant.",
		goType:      reflect.TypeFor[*TenantWideQuery](),
	},
	"checks_uptime": {
		description: "Uptime for a single check over its execution frequency window, as the app displays it.",
		goType:      reflect.TypeFor[*CheckFrequencyQuery](),
	},
}

// TestSchemaCoversRegistry fails if querySchemas and the real registry in
// namedqueries.go ever diverge -- add or remove a named query in one and
// forget the other, and this catches it. It does not check that the shapes
// are *correct*, only that every name is accounted for exactly once.
func TestSchemaCoversRegistry(t *testing.T) {
	var schemaNames []string
	for name := range querySchemas {
		schemaNames = append(schemaNames, name)
	}

	assert.ElementsMatch(t, names(), schemaNames,
		"querySchemas (schema_test.go) and registry (namedqueries.go) must list exactly the same query names")
}
