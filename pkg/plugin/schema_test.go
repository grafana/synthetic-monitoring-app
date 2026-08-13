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
	"checks_uptime": {
		description: "Fraction of time the check was reported up over the check's own frequency window.",
		goType:      reflect.TypeFor[*CheckFrequencyQuery](),
	},
	"reachability": {
		description: "Ratio of successful to total check executions over the dashboard's rate interval.",
		goType:      reflect.TypeFor[*CheckFrequencyQuery](),
	},
	"check_configs": {
		description: "The check's frequency and config version, as of the most recent execution in range.",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"check_probe_max_duration": {
		description: "Longest probe duration recorded for the check in range, grouped by probe.",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"check_probe_avg_duration": {
		description: "Average probe duration for the check in range, across all probes (not filterable to one probe).",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"probe_execution_rate": {
		description: "Rate of successful check executions per probe, summed across all checks in the tenant.",
		goType:      reflect.TypeFor[*TenantWideQuery](),
	},
	"probe_failure_rate": {
		description: "Rate of failed check executions per probe, summed across all checks in the tenant.",
		goType:      reflect.TypeFor[*TenantWideQuery](),
	},
	"sum_duration_by_probe": {
		description: "Sum of the given metric for the check, grouped by probe.",
		goType:      reflect.TypeFor[*CheckMetricQuery](),
	},
	"count_distinct_targets": {
		description: "Count of distinct target URLs seen for the given metric, grouped by job.",
		goType:      reflect.TypeFor[*CheckMetricQuery](),
	},
	"browser_data_received": {
		description: "Sum of browser check data received, grouped by probe.",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"browser_data_sent": {
		description: "Sum of browser check data sent, grouped by probe.",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"scripted_data_received": {
		description: "Raw scripted check data-received series, grouped by probe.",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"scripted_data_sent": {
		description: "Raw scripted check data-sent series, grouped by probe.",
		goType:      reflect.TypeFor[*CheckQuery](),
	},
	"avg_quantile_web_vital": {
		description: "Quantile of a Core Web Vital metric over the dashboard range, grouped by instance and job (plus any extra labels).",
		goType:      reflect.TypeFor[*CheckWebVitalQuery](),
	},
	"avg_request_latency": {
		description: "Average per-request latency for a scripted check, broken out by the given label and method.",
		goType:      reflect.TypeFor[*CheckLabelQuery](),
	},
	"avg_request_success_rate": {
		description: "Average per-request success rate for a scripted check, broken out by the given label and method.",
		goType:      reflect.TypeFor[*CheckLabelQuery](),
	},
	"avg_request_expected_response": {
		description: "Average rate of expected HTTP responses for a scripted check, broken out by the given label and method.",
		goType:      reflect.TypeFor[*CheckLabelQuery](),
	},
	"scripted_http_requests_error_rate": {
		description: "Error rate for one specific request within a scripted check, isolated by label/value and method.",
		goType:      reflect.TypeFor[*CheckLabelMatchQuery](),
	},
	"check_error_logs": {
		description: "Log lines for the check's executions, optionally restricted to failed executions only.",
		goType:      reflect.TypeFor[*CheckLogsQuery](),
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
		Enums: []reflect.Type{
			reflect.TypeFor[WebVitalMetric](),
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
