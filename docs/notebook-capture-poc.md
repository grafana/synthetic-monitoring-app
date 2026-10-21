# Check-detail notebook capture POC

The selected-check dashboard header has one notebook action in its check actions dropdown. This checkout had an action bar (Edit check, SLOs and time controls), not an existing check-detail dropdown, so a small dropdown sits in that action bar without replacing its controls. No global page or check-list capture was added.

The action is hidden while `grafana/add-to-notebook-form/v2` is unavailable/loading, while probe selection is loading/unavailable, or when neither `notebooks:create` nor `notebooks:write` is granted. The host registers the extension only when notebooks are enabled. The plugin declares the extension dependency and locally defines only the props it uses.

Verified against core `public/app/features/notebook/extensions/AddToNotebookForm.tsx` and `AddToNotebookFormExposedComponent.tsx`: v2 markdown cells use `{ kind: 'markdown', text: string }`. This POC passes `cells`, `defaultTitle`, `onClose` and `onAdded` inside a plugin-owned Grafana Modal. Both completion and cancellation dismiss it. Notebook persistence and feedback remain host-owned; no separate write-back API or consumer analytics are added.

## Captured context and exclusions

- On opening, serialize the check name/type, selected raw relative or ISO absolute time, resolved ISO window, timezone, metrics datasource UID and resolved probe filter. The canonical check URL includes the Grafana subpath, check ID, fixed absolute window, timezone and selected probe values, not arbitrary current URL parameters.
- Snapshot strings and cells do not retain mutable check or scene references. Reopening captures the new selection. Markdown values are escaped as text.
- All targets are intentionally omitted, even if visible elsewhere: URL userinfo, query strings, fragments and even paths can contain credentials. No HTTP authentication, headers, request bodies, labels, scripts, telemetry or private raw run payloads are copied.
- This is **context only**, not a captured chart or a query-result snapshot. No selected-panel export is wired. The existing panel export adapter is panel-scoped; this entry point is check-scoped. Native/custom transforms and dashboard visualizations are neither translated nor claimed to be preserved.
- The check name and selected probe names are user-visible context; users should review whether they are appropriate to share. The source check and live data may change after capture. The absolute link preserves the requested window, not historical results or probe configuration.

## Verification scope

Focused Jest tests cover the v2 payload, sensitive-field exclusion, markdown escaping, time/link/filter preservation, extension/permission gating, snapshot isolation and modal dismissal. Existing header tests are included in local validation. No browser, deployment or live notebook-host verification has been performed. A host exposing v2 with notebooks enabled is required for a manual end-to-end check. Dependencies use pinned Node 24/Yarn 4 with an immutable lockfile; no dependency upgrades are required.
