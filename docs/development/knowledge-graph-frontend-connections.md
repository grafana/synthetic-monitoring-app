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

The app stores labels, not graph edges. The managed enrichment and relation rules
were merged in [grafana/asserts-adi#7844](https://github.com/grafana/asserts-adi/pull/7844).
Confirm a backend release containing that change is deployed on the target stack
before enabling the selector. No manual rule upload is required.

The built-in [enrichment](https://github.com/grafana/asserts-adi/blob/ad8754a699a26f2699c1e53936586a23c2fdc809/yoda/src/main/resources/entities_synthetic_monitoring.yml)
and [relation rule](https://github.com/grafana/asserts-adi/blob/ad8754a699a26f2699c1e53936586a23c2fdc809/yoda/src/main/resources/relationships_synthetic_monitoring_frontend.yml)
require Synthetic Monitoring and either Frontend Observability vendor (`feo11y` or
`feo11y-frontend-observability`). Confirm `Frontend` and `SyntheticCheck` discovery
is active on the stack.

Pre-deploy `synthetic-monitoring.knowledge-graph-frontend` disabled through all GOFF
waves before enabling it, following [the migration guide](./openfeature-migration.md).
The definition PRs, in rollout order, are
[dev #777655](https://github.com/grafana/deployment_tools/pull/777655),
[staging #777673](https://github.com/grafana/deployment_tools/pull/777673),
[canary #777674](https://github.com/grafana/deployment_tools/pull/777674), and
[prod #777675](https://github.com/grafana/deployment_tools/pull/777675).
Verify each wave before proceeding to the next; enabling the feature is separate.
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
