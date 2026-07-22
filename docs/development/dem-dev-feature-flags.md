# Feature flags in dem-dev E2E tests

Feature flags should use the narrowest isolation boundary that represents their runtime behavior.
Browser-only flags can vary between Playwright workers against one dem-dev runtime. Flags that
change API startup, schema, provisioning, or service topology require separate runtime profiles.

## Test contract

Use the typed `smFeatureProfile` adapter rather than setting Grafana boot data, OpenFeature values,
or URL parameters directly:

```ts
test.use(
  smFeatureProfile({
    [SM_FEATURE_NAMES.TimepointExplorer]: true,
    [SM_FEATURE_NAMES.Screenshots]: false,
  })
);
```

An omitted flag inherits the runtime default. Explicit `true` and `false` values are isolated to
the Playwright worker. The adapter reads the app's `OPEN_FEATURE_KEYS` map, so a flag's tests do
not change when its evaluation moves from legacy Grafana boot data to OpenFeature.

## Current inventory

All current production SM flags use legacy Grafana boot data. This table records the expected
additional isolation and data requirements; it should be updated when a flag's behavior changes.

| Feature                 | Scope                                     | Additional E2E requirement                             |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Cost attribution labels | Browser and tenant data                   | Seed or mock tenant cost-attribution labels            |
| Folders                 | Browser, Grafana folders, and SM API data | Seed folders and folder permissions                    |
| gRPC checks             | Browser and SM API capability             | Seed a gRPC check when testing results                 |
| Browser screenshots     | Browser and Loki data                     | Seed browser execution logs with screenshot references |
| Secrets management      | Browser and SM API capability             | Configure secrets tokens and seed a compatible check   |
| Timepoint Explorer      | Browser and Prometheus/Loki data          | The `http-latency-spike` scenario is sufficient        |
| Version management      | Browser and SM API data                   | Seed k6 channels and compatible probe metadata         |

The internal `test-only-do-not-use` flag is deliberately excluded from the typed E2E contract.

## When another runtime is required

A browser flag does not belong in the runtime fingerprint. Start another dem-dev only when a test
requires a different service graph, backend process flag, schema, provisioning mode, or component
image. Tests sharing those inputs should share one runtime even when their browser feature flags
differ.
