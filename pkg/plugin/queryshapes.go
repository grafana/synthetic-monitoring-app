package plugin

// queryshapes.go gives each named query its own parameter type instead of one
// struct shared by every entry in the registry, so both Go callers and the
// generated schema (schema_test.go) see what a query actually needs.
//
// Only one shape exists so far because the registry has only one query. Later
// slices add more (a per-check shape, a per-check-plus-frequency shape, and so
// on) as they add queries that need parameters -- see the schema generated on
// `mem/proxy-datasources` for the fuller set this is expected to grow into.

// TenantWideQuery has no parameters: the query is computed across the whole
// tenant. Matches "probe_execution_rate".
type TenantWideQuery struct{}
