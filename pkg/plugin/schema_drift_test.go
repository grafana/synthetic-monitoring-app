//go:build schemadrift

package plugin

import (
	"testing"

	"github.com/stretchr/testify/require"

	sdkapi "github.com/grafana/grafana-plugin-sdk-go/experimental/apis/datasource/v0alpha1"
	"github.com/grafana/grafana-plugin-sdk-go/experimental/schemabuilder"
)

// This file is excluded from the normal `go test ./pkg/...` run (what `mage
// test`/`testRace` -- and so CI's "Test" step -- invoke) by the schemadrift
// build tag. Detecting drift in the generated schema files is a distinct
// concern from "do the backend tests pass", so it runs on its own via `mage
// go:detectSchemaDrift`, called from its own CI workflow. See Magefile.go.

// TestUpdateSchema regenerates the static query-type schema Grafana serves at
// /public/plugins/synthetic-monitoring-datasource/schema/v0alpha1/query.types.json.
// Run it explicitly (`go test -tags schemadrift -run TestUpdateSchema
// ./pkg/plugin/...`) whenever a query type changes, and commit the result --
// or via `mage go:detectSchemaDrift`, which also fails if that leaves the
// working tree dirty.
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

	if t.Failed() {
		// UpdateProviderFiles fails via a raw JSON diff assertion with no pointer
		// back to the fix, which is easy to miss in a full test run.
		t.Log("query.types.json is out of date and has just been regenerated -- " +
			"review the diff and commit the result")
	}
}
