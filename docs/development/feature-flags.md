# Feature flags

Synthetic Monitoring's feature flags are [OpenFeature](https://openfeature.dev/) flags, evaluated
through Grafana's OFREP endpoint and defined with Go Feature Flag (GOFF) in `deployment_tools`.
Legacy Grafana feature toggles (`config.featureToggles`) are no longer read anywhere in this app;
Grafana core is deprecating reads of that map for plugins.

## How it works

- Flags are defined per wave in `deployment_tools`, one file per wave:
  `ksonnet/environments/hosted-grafana/waves/feature-toggles/goff/synthetic-monitoring/{dev,staging,canary,prod}.libsonnet`.
  Keys are `synthetic-monitoring.<kebab-feature>`, and every key carries `+ goff.Public()` because
  the frontend fetches flags through the bulk endpoint, which drops non-public flags.
- In the app, [`FeatureName`](../../src/types.ts) values **are** those keys. Consumers use
  `useFeatureFlag(FeatureName.X)` (or the `<FeatureFlag>` component); call sites that evaluate a
  dynamic list of flags (e.g. `option.featureToggle`) use `useIsFeatureEnabled()`. Both re-render
  when a flag changes at runtime. A flag that OpenFeature can't resolve is `false`.
- The provider is set up in [`SMOpenFeatureProvider`](../../src/components/SMOpenFeatureProvider.tsx)
  when the app mounts (`initOpenFeature()` in [`src/services/featureFlags.ts`](../../src/services/featureFlags.ts)),
  scoped to the plugin's own OpenFeature domain. It composes `@grafana/runtime`'s providers: the
  Feature control localStorage provider first, then Grafana core's OFREP provider, so no request of
  our own is made. It deliberately does not initialise at plugin preload time, which would grow the
  preloaded `module.js` bundle. Children render only once the provider has settled, so the first
  render already sees final flag values.
- `useFeatureFlag` also returns `isReady`, which is `false` only while the provider is still
  initialising. Because of the gate above it is effectively always `true` inside the app; it exists
  for consumers that might render outside `SMOpenFeatureProvider`.

## Adding a flag

1. Define the key in GOFF for each wave, in the files above. Follow the `deployment_tools`
   [feature-toggles README](https://github.com/grafana/deployment_tools/blob/master/ksonnet/environments/hosted-grafana/waves/feature-toggles/README.md):
   roll out `dev` → `staging` → `canary` → `prod`, one PR per wave, with the flag off in waves it
   isn't rolling out to yet. Reviewed by `@grafana-feature-flags`.

   ```jsonnet
   'synthetic-monitoring.my-feature': goff.BooleanFlag(true) + goff.Public(),
   ```

2. Verify the key resolves. Browser console on a stack in the wave (`targetingKey` is required):

   ```js
   const { namespace, appSubUrl = '' } = grafanaBootData.settings;
   const body = await (
     await fetch(`${appSubUrl}/apis/features.grafana.app/v0alpha1/namespaces/${namespace}/ofrep/v1/evaluate/flags`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ context: { targetingKey: namespace, namespace } }),
     })
   ).json();
   body.flags.filter((f) => f.key.startsWith('synthetic-monitoring'));
   ```

3. Add the `FeatureName` entry with the key as its value and consume it via `useFeatureFlag`.
   The app can ship before every wave has the definition: the flag is simply `false` where it is
   undefined.

4. When the feature is GA and permanent, remove the `FeatureName` entry and the dead code paths,
   then the GOFF definitions.

## Targeting and overrides

- Per-stack, per-plan or percentage rollouts are targeting rules in the wave files
  (`goff.ForSlugs`, `goff.BooleanFlag(true, 50)`, ...); see the `deployment_tools` README.
- Per-instance overrides set through gcom belong to the legacy toggle system and have no effect on
  these flags.
- To try a flag in your own browser, use Grafana Feature control (below). The old `?features=`
  URL override no longer exists.

### Grafana Feature control

Feature control overrides take precedence over server evaluations through
`createOpenFeatureLocalStorageProvider` from `@grafana/runtime`. Open Feature control with
`?featureControl=true` and add the exact key (the `FeatureName` value, for example
`synthetic-monitoring.check-suggestions`). Both `true` and `false` overrides are supported.
Changes apply without reloading; deleting an override restores the server value.

Overrides are local to the browser and Grafana origin. They also apply when Graft serves the plugin.

## Local development

Grafana's OFREP endpoint in a local (OSS or enterprise) instance is backed by a static provider
seeded from `[feature_toggles]` in `grafana.ini`, so flags are toggled in `dev/custom.ini` using
the same keys:

```ini
[feature_toggles]
synthetic-monitoring.folders = true
```

Restart Grafana after editing (`docker compose restart` — the ini is only read at startup), then
hard-refresh the browser. The local Grafana must be a version that ships the OpenFeature providers
in `@grafana/runtime` (13.2 or later; `GRAFANA_VERSION=13.2 yarn server`), otherwise provider
initialisation fails and every flag reads `false`. Gotcha when switching between `yarn dev` and
`yarn dev:msw`: the browser caches `module.js` (not content-hashed) and old chunks linger in
`dist/`, so a stale bundle can silently keep running — use DevTools "Clear site data" + "Disable
cache".

## Testing

`test/render` (and `createWrapper`) mount the SDK's `OpenFeatureTestProvider`, driven by a shared
flag map ([`src/test/openFeatureTestProvider.ts`](../../src/test/openFeatureTestProvider.ts)) that
is reset between tests. Set flags with `mockFeatureToggles({ [FeatureName.X]: true })` before
rendering. Tests that render a flag consumer with a bare React Testing Library `render` must wrap it
in `OpenFeatureTestProvider` themselves (or use `createWrapper`), otherwise the OpenFeature hooks
throw for want of a provider.
