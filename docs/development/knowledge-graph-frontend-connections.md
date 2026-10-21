# Knowledge Graph frontend connections

The optional frontend selector stores `feo11y_app_id` alongside `service_name`
and `namespace`. Removing it preserves service and custom labels; CAL-managed
values stay in their fixed CAL row. An unrelated `app` label creates no connection.

**Add connection** offers missing connection types. Empty rows do not change
labels or dirty the form. Both types have one row-level remove action; removing
a Service clears its name and its custom namespace, preserving a CAL-managed
namespace. **Any namespace** removes only the namespace constraint. Narrow editors stack the service fields inside the
shared Labels scroll area. CAL inputs retain their existing per-field clearing.

## Required deployment

The app stores labels, not graph edges. Enable `Frontend` and `SyntheticCheck`
discovery and wait for the managed backend rules in
[grafana/asserts-adi#7844](https://github.com/grafana/asserts-adi/pull/7844)
to be merged and deployed before enabling the selector. The app does not install rules.
The companion YAML is a temporary development reference; remove it once the managed
rules are available. Do not use it as a separate production deployment step.

Pre-deploy `synthetic-monitoring.knowledge-graph-frontend` disabled through all GOFF
waves before enabling it, following [the migration guide](./openfeature-migration.md).
With this flag off, frontend labels remain ordinary custom labels, and the panel,
mini-graph query and Knowledge Graph link use service connections only.

The enrichment preserves existing discovery and maps:

- `sm_check_info` `job__instance` → `SyntheticCheck.name`, retaining the full target.
- `feo11y_app_id` → `SyntheticCheck.frontend_app_id`; legacy `label_feo11y_app_id`
  is accepted, with the unprefixed value taking precedence.
- `asserts_env="none"` matches the built-in scope-less check identity.
- A `PROPERTY_MATCH` rule joins `Frontend.feo11y_app_id` to the enriched property,
  producing `Frontend → MONITORED_BY → SyntheticCheck` across frontend environments.
  The selector's environment names are context, not independently selectable scopes.

Checks without either label spelling receive `frontend_app_id="__none__"`, which
matches no frontend. This overwrites stale associations; omitting a metric label
alone would not clear the stored property. Changes take effect after telemetry
staleness, enrichment (default five minutes), and graph-builder expiry cycles.

The panel filters relationship lifetimes at the selected range's end. Its Cypher
uses bound `UNION` branches: direct monitored entities, plus Service CALLS neighbours.
The lifetime predicates depend on the KG storage properties `_created` and `_expired`
(epoch milliseconds), defined in asserts-adi's `ReservedProperty.java`. They are not
an independently versioned public API: a backend schema change needs a coordinated
update here and historical-topology validation. Missing timestamps retain the
existing open-boundary semantics.
Returning an unmatched `OPTIONAL MATCH` variable can drop the entire KG result
([prior regression](https://github.com/grafana/synthetic-monitoring-app/pull/1885)).

## Rollout checks

Confirm the managed backend rule and disabled GOFF definition have reached the target stack before enabling the flag.

After deployment, verify selection emits the app ID and creates the edge; service-only,
frontend-only, and mixed connections render; changing/clearing expires only the old
association; checks sharing a job but different targets stay distinct; historical
views retain edges active then. App tests and schema validation cannot establish
these graph-builder and real-telemetry behaviors.
