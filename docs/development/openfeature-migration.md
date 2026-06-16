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
- In tests, the render wrappers use the SDK's `OpenFeatureTestProvider`, driven by a small
  shared flag map ([`src/test/openFeatureTestProvider.ts`](../../src/test/openFeatureTestProvider.ts)).
  `mockFeatureToggles` writes into that map as well as `config.featureToggles`, so test call
  sites are identical for legacy and migrated flags.

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

## Migrating one flag

Existing legacy toggles are **automatically mirrored into the flag service**: hosted-grafana
converts `features-{env}.libsonnet` definitions to GOFF format, so the legacy flag names are
already served at the OFREP endpoint (per-stack instance overrides included). Migration is
therefore two independent steps — switch the read path first, move the definition later.

### Step A — route the flag through OpenFeature (frontend-only PR)

1. Pre-flight:
   - Flag is at **0% or 100% rollout per environment** in `deployment_tools`
     `features-{dev,staging,prod}.libsonnet` (mid-rollout migration shifts the targeted
     population — ask in
     [#grafana-feature-flags](https://grafanalabs.enterprise.slack.com/archives/C04TRENCD2L) if unsure).
   - `synthetic-monitoring-api` / `synthetic-monitoring-agent` don't read the flag string.
   - No module-scope reads in this repo (they'd return the default forever; move into a
     hook/function first).
2. Add one entry to `OPEN_FEATURE_KEYS` in
   [`src/services/featureFlags.ts`](../../src/services/featureFlags.ts), mapping to the
   **existing legacy flag name** — no deployment_tools change needed:

   ```ts
   export const OPEN_FEATURE_KEYS: Partial<Record<FeatureName, string>> = {
     [FeatureName.CALs]: 'synthetic-monitoring-cost-attribution',
   };
   ```

   All `useFeatureFlag` / `<FeatureFlag>` consumers flip to OpenFeature atomically. Swap any
   non-React call sites (direct `isFeatureEnabled` calls) to `getBooleanFlag(...)`. Existing
   `mockFeatureToggles({ [FeatureName.X]: true })` test calls keep working unchanged.
3. Smoke test in dev/staging: the flag should resolve with the same value as before
   (`reason: TARGETING_MATCH` from the mirrored definition).

Note: the `?features=<flag>` URL override no longer applies once a flag is routed.

### Step B — move the definition to the new pattern (deployment_tools PRs)

1. Define the dotted key in
   `ksonnet/environments/hosted-grafana/waves/feature-toggles/goff/k6/{env}.libsonnet`,
   mirroring the current legacy targeting. Per the deployment_tools README, GOFF flags must
   be **pre-deployed (disabled) through all waves** (`dev` → `staging` → `canary` → `prod`)
   before code evaluates them:

   ```jsonnet
   'synthetic-monitoring.cost-attribution': goff.BooleanFlag(true),
   ```

   > Naming: `synthetic-monitoring.<kebab-feature>` (provisional — folder precedent is
   > `k6-app.<feature>`; confirm with #grafana-feature-flags). Reviewed by `@grafana-feature-flags`.
2. Verify the key resolves at the OFREP endpoint (browser console on the stack):

   ```js
   await (
     await fetch('/apis/features.grafana.app/v0alpha1/namespaces/' + grafanaBootData.settings.namespace + '/ofrep/v1/evaluate/flags', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ context: {} }),
     })
   ).json();
   ```

3. Flip the `OPEN_FEATURE_KEYS` value from the legacy name to the dotted key.
4. Remove the legacy `features-{env}.libsonnet` entries (kills the auto-mirrored flag).
5. Cleanup after one release of stability: if the feature is GA and permanent, remove the
   `FeatureName` entry, the mapping, the dead code paths, and finally the GOFF definition.

## Adding a brand-new flag

Skip the legacy system entirely: define the dotted GOFF flag (Step B.1), verify (B.2), add a
`FeatureName` entry plus its `OPEN_FEATURE_KEYS` mapping, and consume it via `useFeatureFlag`.
