# Feature flags

Synthetic Monitoring's feature flags are [OpenFeature](https://openfeature.dev/) flags, evaluated
through Grafana's OFREP endpoint and defined with Go Feature Flag (GOFF) in `deployment_tools`.
Legacy Grafana feature toggles (`config.featureToggles`) are no longer read anywhere in this app and
must not be reintroduced: Grafana core is deprecating those reads for plugins
(`grafana.frontendLegacyFeatureToggleHandling`, which can block them outright).

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

### Waves

| Wave      | Who is in it                                                | Verify on                        |
| --------- | ----------------------------------------------------------- | -------------------------------- |
| `dev`     | Staff stacks on `grafana-dev.net`                           | your own `*.grafana-dev.net`     |
| `staging` | `ops.grafana-ops.net` and staff stacks on `grafana-ops.com` | `ops.grafana-ops.net`            |
| `canary`  | Mostly free instances, a few paid                           | a stack in a prod-canary cluster |
| `prod`    | Everyone else, including the largest customers              | a `*.grafana.net` stack          |

A `deployment_tools` merge reaches a wave in roughly 10–15 minutes (kube-manifests export, Flux
sync, GOFF re-reads its ConfigMap every minute, Grafana core re-fetches the bulk response every
30 s). Unlike legacy toggles, no instance restart is involved.

## Adding a flag

1. Add the key to **all four** wave files, on in the waves it is rolling out to and off elsewhere.
   The `synthetic-monitoring` folder is already registered in every `goff-{env}.libsonnet`
   aggregator, so a new key is one line per file. Keep the files sorted by key.

   ```jsonnet
   'synthetic-monitoring.my-feature': goff.BooleanFlag(true) + goff.Public(),   // dev.libsonnet
   'synthetic-monitoring.my-feature': goff.BooleanFlag(false) + goff.Public(),  // staging, canary, prod
   ```

   Check the rendered output before opening the PR (from the `deployment_tools` root):

   ```sh
   jsonnetfmt -i ksonnet/environments/hosted-grafana/waves/feature-toggles/goff/synthetic-monitoring/*.libsonnet
   jsonnet -J ksonnet/lib -J ksonnet/vendor ksonnet/environments/hosted-grafana/waves/feature-toggles/goff/goff-dev.libsonnet \
     | jq '."synthetic-monitoring.my-feature"'
   ```

   Expect `variations` of `enabled`/`disabled`, a `defaultRule`, and `metadata.public: "true"`.
   Request review from `@grafana-feature-flags` (the folder has no CODEOWNERS entry, so nobody is
   auto-requested). Follow the `deployment_tools`
   [feature-toggles README](https://github.com/grafana/deployment_tools/blob/master/ksonnet/environments/hosted-grafana/waves/feature-toggles/README.md)
   for anything not covered here.

2. After the merge has rolled out, verify the key is served. Browser console on a stack in the
   wave (`targetingKey` is required):

   ```js
   const { namespace, appSubUrl = '' } = grafanaBootData.settings;
   const body = await (
     await fetch(`${appSubUrl}/apis/features.grafana.app/v0alpha1/namespaces/${namespace}/ofrep/v1/evaluate/flags`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ context: { targetingKey: namespace, namespace } }),
     })
   ).json();
   body.flags.filter((f) => f.key.startsWith('synthetic-monitoring')).map((f) => `${f.key}=${f.value} (${f.reason})`);
   ```

3. Add the `FeatureName` entry with the key as its value and consume it via `useFeatureFlag`.
   The app can ship before every wave has the definition: the flag is simply `false` where it is
   undefined. Gate tests with `mockFeatureToggles` (see [Testing](#testing)).

## Rolling out and changing values

Flipping a flag is a one-line change in the wave file (`BooleanFlag(false)` → `BooleanFlag(true)`),
one PR per wave, in wave order. Verify with the snippet above after each wave and smoke test the
feature before moving to the next. The README's rollout guidance (`dev`/`staging` for
experimental, `canary` for private preview, `prod` with percentages for public preview) applies.

Partial rollouts are percentages or targeting rules on the same line. Values must be consistent
within a wave: every stack in the wave reads the same file.

```jsonnet
'synthetic-monitoring.my-feature': goff.BooleanFlag(true, 50) + goff.Public(),           // 50% of stacks
'synthetic-monitoring.my-feature': goff.BooleanFlag(true, 50) + goff.Public() + goff.BucketByOrg(),  // 50% of orgs
```

## Targeting specific stacks

Per-stack access (private preview customers, staff test stacks, disabling a feature for one stack)
is a targeting rule on the flag, composed with `+`. Prefer stack IDs over slugs: slugs can change.
Comment each ID with the slug so the list stays reviewable.

```jsonnet
'synthetic-monitoring.my-feature': goff.BooleanFlag(false) + goff.Public() + goff.ForStackIds([
  '421690',  // ukg
  '1145632',  // rapid7
]),
'synthetic-monitoring.other-feature': goff.BooleanFlag(true) + goff.Public() + goff.NotForStackIds([
  '35611',  // play
]),
```

Other helpers: `goff.ForSlugs`, `goff.ForOrgIds`, `goff.ForOrgSlugs`, `goff.ForClusters`, and the
`NotFor*` variants. The stack ID is the number in `grafanaBootData.settings.namespace`
(`stacks-<id>`) or the stack's gcom record.

Per-instance overrides set through gcom belong to the legacy toggle system and have **no effect**
on these flags, and MTFF only applies a stack's targeting rules when it knows the stack's
namespace, which it does for any request made from the stack itself.

## Removing a flag

When a feature is GA and permanent:

1. Remove the `FeatureName` entry and the code paths behind it, and ship that release to every
   wave (`_catalog_version` in
   `ksonnet/environments/hosted-grafana/waves/provisioned-plugins/grafana-synthetic-monitoring-app/`).
2. Remove the key from the four wave files. Order matters only for noise: a key the app still reads
   but GOFF no longer defines resolves to `false`, so remove the reads first.

## Verifying what the app resolved

The bulk snippet above shows what MTFF serves; this shows what the app's own client resolved,
including Feature control overrides and error codes. Run it on a Synthetic Monitoring page:

```js
const client = globalThis[Symbol.for('@openfeature/web-sdk/api')].getClient('grafana-synthetic-monitoring-app');
client.getBooleanDetails('synthetic-monitoring.my-feature', false);
```

`reason: TARGETING_MATCH`/`STATIC`/`DEFAULT` means a provider resolved it. An `errorCode` means
neither provider did; the `errorMessage` of a `GENERAL` error names only the first provider
(Feature control's localStorage), so "Unable to find a localStorage entry" does not mean the OFREP
provider was skipped. If the key is missing from the bulk response, check the wave's file and the
[Flux dashboard](https://ops.grafana-ops.net/d/f1d065daae5d7f0f5c5b3ac0504a565a/cluster-stats?orgId=1)
for that stack's cluster, and confirm the hostname is in the wave you think it is.

## Grafana Feature control

Feature control overrides take precedence over server evaluations through
`createOpenFeatureLocalStorageProvider` from `@grafana/runtime`. Open Feature control with
`?featureControl=true` and add the exact key (the `FeatureName` value, for example
`synthetic-monitoring.check-suggestions`). Both `true` and `false` overrides are supported.
Changes apply without reloading; deleting an override restores the server value. The old
`?features=` URL override no longer exists.

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
