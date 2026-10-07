# Knowledge Graph frontend connections

The optional frontend selector stores `feo11y_app_id` alongside `service_name`
and `namespace`. Clearing it preserves service and custom labels; CAL-managed
values stay in their fixed CAL row. An unrelated `app` label creates no connection.

## Required deployment

The app stores labels, not graph edges. Enable `Frontend` and `SyntheticCheck`
discovery and deploy the companion [model rules](./knowledge-graph-frontend-connections.yaml)
through **Observability → Rules → Entity & Relation**, or incorporate them into
managed KG rules, before rolling out the selector. The app does not install rules.

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
Returning an unmatched `OPTIONAL MATCH` variable can drop the entire KG result
([prior regression](https://github.com/grafana/synthetic-monitoring-app/pull/1885)).

## Rollout checks

Validate without uploading: `gcx kg model-rules upsert --context <stack-context> --file docs/development/knowledge-graph-frontend-connections.yaml --dry-run`.

After deployment, verify selection emits the app ID and creates the edge; service-only,
frontend-only, and mixed connections render; changing/clearing expires only the old
association; checks sharing a job but different targets stay distinct; historical
views retain edges active then. App tests and schema validation cannot establish
these graph-builder and real-telemetry behaviors.
