# Knowledge Graph frontend connections

The check editor stores a frontend selection as the ordinary check label
`feo11y_app_id`. It can coexist with `service_name` and `namespace`; clearing the
frontend selection removes only `feo11y_app_id`. An unrelated `app` custom label
does not establish a connection.

## Knowledge Graph dependency

Saving the label does not create a graph edge by itself. Knowledge Graph must have
both `Frontend` and `SyntheticCheck` discovery enabled, plus the companion
[model rules](./knowledge-graph-frontend-connections.yaml). Deploy that file
through Knowledge Graph's **Observability → Rules → Entity & Relation** editor
before rolling out the selector, or incorporate its equivalent into the managed
Knowledge Graph rules. The app does not install or update rules.

The file adds an `enrichedBy` query to the existing `SyntheticCheck` type and a
[`PROPERTY_MATCH` relationship](https://grafana.com/docs/grafana-cloud/platform/knowledge-graph/configure/manage-entities-relations/#example-how-the-knowledge-graph-defines-relations).
Enrichment updates existing checks without replacing their discovery rules.
`entities` and `relations` are separate root-level arrays, as shown in the public
[`ModelRulesDto` schema](https://github.com/grafana/grafana-asserts-public-clients/blob/main/go/gcom/docs/ModelRulesDto.md)
definition.

The mapping contract is:

| Source                                                        | Match                                      |
| ------------------------------------------------------------- | ------------------------------------------ |
| `sm_check_info` labels `job` and `instance`, joined with `__` | Existing `SyntheticCheck.name`             |
| Check label `feo11y_app_id`                                   | Enriched `SyntheticCheck.frontend_app_id`  |
| `SyntheticCheck.frontend_app_id`                              | Existing `Frontend.feo11y_app_id`          |
| Relationship direction                                        | `Frontend → MONITORED_BY → SyntheticCheck` |

The query accepts both `feo11y_app_id` and the older
`label_feo11y_app_id` metric label. The unprefixed value takes precedence when both
are present on a series. Aggregation immediately around each selector removes
probe dimensions while preserving the mapping labels. Matching the check's full
`job__instance` name distinguishes checks with the same job and different targets
and preserves the target's scheme and port.

The enrichment query sets `asserts_env="none"`, matching the built-in discovery
rule's scope-less check identity. The relationship compares only app IDs, so it
does not require a scope-less check and an environment-scoped frontend to share
the same scope. A `METRICS` relationship omitting scope matchers would implicitly
require scope-less endpoints and miss environment-scoped Frontends.

The association identifies an application, not a single environment. If several
active Frontend entities share an app ID, the rule connects them all. Environment
text in the selector provides context; storing only the app ID cannot select one
of those environments independently.

## Changes and removal

The query assigns `frontend_app_id="__none__"` to every current check that lacks
both spellings of the label. This overwrites any previous association; an absent
metric label alone would not clear a stored entity property. Changing the
selection replaces that property with the new app ID. No Frontend has the
sentinel app ID, so clearing the selection stops the old relationship matching
once old telemetry becomes stale and enrichment runs again. Knowledge Graph
then expires the old edge.

Allow the configured entity-enrichment interval as well as the graph builder's
cadence; the default enrichment interval is five minutes. This is asynchronous,
so the editor confirms that the selected entity exists rather than claiming the
edge has already been created. The connected-entities panel shows topology at
the end of its selected time range, so historical views can still include an edge
that was active at that time. Its Cypher query explicitly filters relationship
creation and expiry timestamps; the KG Cypher endpoint does not apply the
requested time range to edges itself.

## Validation before rollout

Validate the file against the target stack without uploading it:

```sh
gcx kg model-rules upsert \
  --context <stack-context> \
  --file docs/development/knowledge-graph-frontend-connections.yaml \
  --dry-run
```

After installing the rule, verify all of the following on a test check:

1. Saving a frontend emits its app ID on `sm_check_info` and produces the expected
   `Frontend → MONITORED_BY → SyntheticCheck` edge.
2. A service and frontend can be connected simultaneously; a frontend-only check
   also displays its graph.
3. Changing and clearing the frontend selection expires the previous edge after
   telemetry staleness, enrichment, and graph expiry windows pass, while preserving service links and
   unrelated custom labels.
4. Checks sharing a job but using different targets are not connected together.

App tests and rule validation do not establish that these end-to-end behaviors
work in a deployment; they require the graph builder and real check telemetry.
