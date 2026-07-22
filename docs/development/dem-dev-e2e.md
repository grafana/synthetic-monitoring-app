# Closed-loop end-to-end testing with dem-dev

This prototype runs the plugin against a real local Synthetic Monitoring stack, seeds that
stack with a deterministic historical scenario, and drives the resulting UI with Playwright.
The same lifecycle is used locally and in pull-request CI.

These are deterministic, closed-loop system tests. They exercise the real plugin, Grafana,
SM API, MySQL, Prometheus, and Loki while using local control-plane/auth mocks and generated
history. They do not validate Grafana Cloud deployment, provisioning, routing, authentication,
or live service configuration. A future `grafana-cloud` suite will cover those deployed-system
concerns with a separate Playwright configuration, workflow, credentials, and cleanup contract.

Feature-on and feature-off browser tests can share this runtime. See
[Feature flags in dem-dev E2E tests](dem-dev-feature-flags.md) for the typed test contract and the
boundary between browser profiles and runtime profiles.

## Responsibility boundary

The app repository owns:

- building the plugin `dist/` under test;
- its Playwright configuration and app-specific assertions;
- selecting the pinned `dem-dev` runtime used by CI.

`dem-dev` owns the Grafana, SM API, MySQL, Prometheus, Loki, and mock-service topology. It also
owns scenario definitions, ingestion verification, and the expected-values manifest consumed
by the browser test.

The app's E2E directory separates runtime inputs from reusable test code and executable
journeys:

```text
e2e/
├── environments/
│   └── dem-dev/           # pinned closed-loop runtime inputs
├── support/
│   ├── checks.ts          # environment-independent app navigation
│   └── dem-dev/           # scenario and feature-profile helpers
├── tests/
│   ├── dem-dev/
│   │   ├── historical/
│   │   │   ├── read/      # journeys that observe backfilled state
│   │   │   └── write/     # journeys that mutate and restore backfilled state
│   │   └── hybrid/
│   │       └── read/      # history → real probe fault → recovery journeys
│   └── grafana-cloud/     # future deployed-environment journeys
└── tsconfig.json
```

Only `tests/` contains executable specs. The target environment is always the first directory
beneath `tests/`; the next directory records the temporal mode (`historical` or `hybrid`).
Read/write is an isolation boundary within a temporal mode, not a universal E2E taxonomy.
Scenario definitions remain owned by dem-dev; the app reads the generated manifest from
`artifacts/dem-dev/scenario.json` instead of maintaining a second scenario fixture.

The app bridge delegates runtime commands to dem-dev's `scripts/sm-e2e.sh` when the selected
dem-dev revision provides it. It temporarily retains its original lifecycle implementation
as a compatibility fallback because the POC runtime lock predates that interface; after the
lock advances to a published dem-dev revision, the fallback can be deleted.

The current workflow still checks out `dem-dev`, `synthetic-monitoring-api`, and
`synthetic-monitoring-agent`. Their exact revisions are visible in
[`e2e/environments/dem-dev/runtime.env`](../../e2e/environments/dem-dev/runtime.env). This is
transitional: the intended runtime release replaces those three revisions with one version
containing pinned runtime images and a scenario runner with its agent collector compiled in.

## Local workflow

Point `DEM_DEV_ROOT` at an existing dem-dev checkout. For historical tests its `.env` must set:

```dotenv
SM_GRAFANA_PLUGIN=/absolute/path/to/synthetic-monitoring-app
SM_API_REPO=/absolute/path/to/synthetic-monitoring-api
SM_AGENT_REPO=/absolute/path/to/synthetic-monitoring-agent
FEO_ENABLED=false
SIMNET_ENABLED=false
SM_PROBES_COUNT=0
```

Then build the plugin and inspect the environment:

```bash
yarn build
DEM_DEV_ROOT=/path/to/dem-dev yarn e2e:dem:doctor
```

For an iterative frontend loop, keep webpack watching in one terminal:

```bash
yarn dev
```

Use another terminal for the environment and scenario:

```bash
export DEM_DEV_ROOT=/path/to/dem-dev
yarn e2e:dem:up
yarn e2e:dem:seed
yarn e2e:ui
```

To run the same read-then-write buckets shown in CI without using UI mode:

```bash
yarn e2e:dem:test:historical-read
yarn e2e:dem:test:historical-write
```

For the real-probe handoff, use a disposable checkout configured with the live profile:

```bash
export DEM_DEV_ROOT=/path/to/disposable/dem-dev
export DEM_E2E_PROFILE=sm-live-probe
yarn e2e:dem:configure
yarn e2e:dem:up
yarn e2e:dem:hybrid
yarn e2e:dem:test:hybrid-read
yarn e2e:dem:cleanup
yarn e2e:dem:down
```

The hybrid manifest proves history, the real `503`, Simnet recovery, and the real `200`
before Playwright starts. The controller deliberately leaves the run-owned check enabled for
the browser evidence window; `cleanup` disables and deletes it afterward.

The write journey restores the seeded check to its original enabled state. The two projects are
independently selectable and have no Playwright dependency; the current config keeps them serial
because they share one mutable local stack. Running `yarn e2e --list` discovers both projects
without requiring a running or seeded dem-dev because runtime artifacts are loaded lazily by a
test fixture. A future Grafana Cloud suite must use a different explicit configuration rather
than being added to this default command.

> `yarn e2e:dem:seed` defaults to `DEM_E2E_CLEAN=true`. It wipes all Prometheus and Loki data
> owned by the selected dem-dev runtime before writing the scenario. Use a disposable runtime
> for isolation, or set `DEM_E2E_CLEAN=false` when intentionally appending to a developer stack.

Pull-request CI uses two isolated hosted runners: `historical` uses the inexpensive
`sm-seeded` profile, while `hybrid` uses `sm-live-probe`. The historical job sets
`DEM_E2E_CLEAN=false` because its volumes are already fresh; the hybrid job always performs
run-owned cleanup before stack teardown.

The default scenario is `http-latency-spike`, rendered as 30 minutes of history ending at
the current time. Override it without changing test code:

```bash
DEM_E2E_SCENARIO=http-latency-spike \
DEM_E2E_DURATION_HOURS=1 \
yarn e2e:dem:seed
```

The read browser journey uses `artifacts/dem-dev/scenario.json` to find the generated check,
verify its target/frequency/probe topology, and open its dashboard. The write journey disables
and restores that check to exercise a mutation against the real API.

For the CI-shaped lifecycle, including cleanup:

```bash
DEM_DEV_ROOT=/path/to/dem-dev yarn e2e:dem
```

Set `DEM_E2E_KEEP_STACK=true` to retain a failed or successful stack for local inspection.
Otherwise failures capture per-container logs before teardown.

Set `PLAYWRIGHT_CAPTURE=always` to retain videos and screenshots for every local journey. CI
does this automatically, merges the read and write results into one HTML report, and uploads
that report alongside the raw recordings for 14 days. Traces are retained when a journey
fails. The workflow exposes separate timings for build, dependency/browser installation,
runtime startup, scenario seeding, read journeys, write journeys, report generation, and
teardown so startup improvements can be measured directly in GitHub Actions.

## Disposable runtime configuration

CI starts from a fresh dem-dev checkout and can generate its `.env` through the bridge:

```bash
DEM_DEV_ROOT=/path/to/disposable/dem-dev \
SM_API_REPO=/path/to/synthetic-monitoring-api \
SM_AGENT_REPO=/path/to/synthetic-monitoring-agent \
yarn e2e:dem:configure
```

`configure` refuses to overwrite an existing `.env`. `DEM_E2E_FORCE_CONFIGURE=true` exists for
CI reruns against a known-disposable checkout and should not be used against a developer's
normal dem-dev environment.

## Runtime interface

The app owns its build and Playwright assertions; dem-dev owns Tilt, `.env`, scenario seeding,
diagnostics, and cleanup. The current shell contract is:

```bash
DEM_E2E_ARTIFACT_DIR="$PWD/artifacts/dem-dev" \
SM_GRAFANA_PLUGIN="$PWD" \
  "$DEM_DEV_ROOT/scripts/sm-e2e.sh" run -- yarn e2e
```

The test command receives `DEM_SCENARIO_MANIFEST`. Other SM repositories can use the same
lifecycle and their own test command; future typed replacement slots will let them swap an API,
agent, or alerts image while retaining the shared stack and scenario contract.
