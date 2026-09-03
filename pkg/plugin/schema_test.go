package plugin

import (
	"reflect"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	sdkapi "github.com/grafana/grafana-plugin-sdk-go/experimental/apis/datasource/v0alpha1"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/schemabuilder"
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

// TestUpdateSchema regenerates the static query-type schema Grafana serves at
// /public/plugins/synthetic-monitoring-datasource/schema/v0alpha1/query.types.json.
// Run it explicitly (`go test ./pkg/plugin/... -run TestUpdateSchema`) whenever
// a query type changes; it also runs as part of `go test ./...` and fails
// (while still writing the file) if the spec content changed and wasn't
// committed.
func TestUpdateSchema(t *testing.T) {
	builder, err := schemabuilder.NewSchemaBuilder(schemabuilder.BuilderOptions{
		PluginID: []string{ID},
		ScanCode: []schemabuilder.CodePaths{
			{
				BasePackage: "github.com/grafana/synthetic-monitoring-app/pkg/plugin",
				CodePath:    "./",
			},
		},
	})
	require.NoError(t, err)

	var queries []schemabuilder.QueryTypeInfo
	for name, qs := range querySchemas {
		queries = append(queries, schemabuilder.QueryTypeInfo{
			Description:    qs.description,
			Discriminators: sdkapi.NewDiscriminators("queryType", name),
			GoType:         qs.goType,
		})
	}

	err = builder.AddQueries(queries)
	require.NoError(t, err)

	builder.UpdateProviderFiles(t, "v0alpha1", "../../src/datasource/schema")
}
