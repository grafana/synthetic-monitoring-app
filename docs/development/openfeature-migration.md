# Migrating a feature flag to OpenFeature

Synthetic Monitoring is migrating from Grafana's legacy feature toggles (`config.featureToggles`)
to [OpenFeature](https://openfeature.dev/), evaluated through Grafana's OFREP endpoint and
configured with Go Feature Flag (GOFF) in `deployment_tools`.
Tracking issue: [#1717](https://github.com/grafana/synthetic-monitoring-app/issues/1717).

## How it works

- The OpenFeature provider is initialized when the app mounts (`initOpenFeature()` in
  [`src/services/featureFlags.ts`](../../src/services/featureFlags.ts)) against
  `/apis/features.grafana.app/v0alpha1/namespaces/<namespace>`, scoped to the plugin's own
  OpenFeature domain. It deliberately does not initialize at plugin preload time: that would
  grow the preloaded `module.js` bundle and fire OFREP requests on every Grafana page.
- Consumers always use `useFeatureFlag(FeatureName.X)` (or the `<FeatureFlag>` component).
  The hook routes each flag based on `OPEN_FEATURE_KEYS`:
  - **Mapped** -> evaluated through OpenFeature (render-cycle aware, picks up runtime changes).
  - **Not mapped** -> legacy `config.featureToggles` (plus the `?features=` URL override).
- OSS/on-prem Grafana (>= 12.x) serves the same OFREP endpoint backed by a static provider
  seeded from `[feature_toggles]` in grafana.ini, so operators set migrated flags via ini +
  restart, like legacy toggles. GOFF (runtime changes, rollout targeting) is Cloud-only;
  GOFF-defined flags are default-off in OSS unless the operator opts in. Where the features
  API doesn't exist at all, provider init fails gracefully and flags resolve to defaults.
- In tests, the SM domain is backed by an in-memory provider
  ([`src/test/openFeatureTestProvider.ts`](../../src/test/openFeatureTestProvider.ts));
  `mockFeatureToggles` drives both backends, so test call sites are identical for legacy and
  migrated flags.

## Local development

The `dev/custom.ini` workflow is unchanged: Grafana's OFREP endpoint is backed by a static
provider seeded from the same `[feature_toggles]` section, so OpenFeature flags can be
toggled locally exactly like legacy ones:

```ini
[feature_toggles]
synthetic-monitoring.cost-attribution = true
```

Restart Grafana after editing (`docker compose restart` — the ini is only read at startup),
then hard-refresh the browser. Gotcha when switching between `yarn dev` and `yarn dev:msw`:
the browser caches `module.js` (not content-hashed) and old chunks linger in `dist/`, so a
stale bundle can silently keep running — use DevTools "Clear site data" + "Disable cache".

## Migrating one flag (one small PR per flag)

### 1. Pre-flight checks

- Confirm the flag is at **0% or 100% rollout per environment** in `deployment_tools`
  (`ksonnet/environments/hosted-grafana/waves/feature-toggles/features-{dev,staging,prod}.libsonnet`).
  Migrating a mid-rollout flag shifts the targeted population. Ask in
  [#grafana-feature-flags](https://grafanalabs.enterprise.slack.com/archives/C04TRENCD2L) if unsure.
- Confirm `synthetic-monitoring-api` and `synthetic-monitoring-agent` don't read the legacy
  flag string (search both repos).
- Confirm the flag has no module-scope reads in this repo (a read at module-evaluation time
  returns the default forever; move it into a hook/function first).
- Decide the OSS impact: after migration the flag is default-off outside Grafana Cloud
  unless the operator enables it in `[feature_toggles]` (see Local development above).

### 2. Register the flag in deployment_tools (GOFF)

Add the new dotted key to
`ksonnet/environments/hosted-grafana/waves/feature-toggles/goff/k6/{dev,staging,canary,prod}.libsonnet`,
mirroring the flag's current legacy targeting. Example (`dev.libsonnet`):

```jsonnet
'synthetic-monitoring.cost-attribution': goff.BooleanFlag(true),
```

> Naming: `synthetic-monitoring.<kebab-feature>` (provisional until the prefix convention is
> confirmed with #grafana-feature-flags — the folder precedent is `k6-app.<feature>`).

Get the PR reviewed by `@grafana-feature-flags`.

### 3. Verify the flag is live

After the deployment_tools change propagates, confirm the key resolves at the OFREP endpoint
in the target environment (run from the browser console on the stack, where auth is implicit):

```js
await (
  await fetch('/apis/features.grafana.app/v0alpha1/namespaces/' + grafanaBootData.settings.namespace + '/ofrep/v1/evaluate/flags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context: {} }),
  })
).json();
```

The response's `flags` array should include the new key.

### 4. Route the flag in this repo

Add one entry to `OPEN_FEATURE_KEYS` in
[`src/services/featureFlags.ts`](../../src/services/featureFlags.ts):

```ts
export const OPEN_FEATURE_KEYS: Partial<Record<FeatureName, string>> = {
  [FeatureName.CALs]: 'synthetic-monitoring.cost-attribution',
};
```

All `useFeatureFlag` / `<FeatureFlag>` consumers flip to OpenFeature atomically.
If the flag has non-React call sites (direct `isFeatureEnabled` calls outside the render
cycle), swap them to `getBooleanFlag('<dotted key>', false)`.

Tests: existing `mockFeatureToggles({ [FeatureName.X]: true })` calls keep working unchanged.

### 5. Verify, then retire the legacy entries

- Smoke test in dev and staging (and prod if the flag was live there).
- Follow-up `deployment_tools` PR: remove the flag from the legacy
  `features-{env}.libsonnet` lists.
- The `?features=<flag>` URL override no longer applies to migrated flags. Flag changes now
  happen at runtime via GOFF config — no deploy needed.

### 6. Cleanup (after one release of stability)

- If the feature is fully rolled out and permanent, remove the `FeatureName` entry, the
  `OPEN_FEATURE_KEYS` entry, and the dead conditional code paths; then remove the GOFF
  definition in a final deployment_tools PR.

## Adding a brand-new flag

Skip the legacy system entirely: define the GOFF flag (step 2), verify (step 3), add a
`FeatureName` entry plus its `OPEN_FEATURE_KEYS` mapping (step 4), and consume it via
`useFeatureFlag`.
