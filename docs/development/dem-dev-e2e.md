# End-to-end testing with dem-dev

This prototype runs the plugin against a real local Synthetic Monitoring stack, seeds that
stack with a deterministic historical scenario, and drives the resulting UI with Playwright.
The same lifecycle is used locally and in pull-request CI.

## Responsibility boundary

The app repository owns:

- building the plugin `dist/` under test;
- its Playwright configuration and app-specific assertions;
- selecting the pinned `dem-dev` runtime used by CI.

`dem-dev` owns the Grafana, SM API, MySQL, Prometheus, Loki, and mock-service topology. It also
owns scenario definitions, ingestion verification, and the expected-values manifest consumed
by the browser test.

The app bridge delegates runtime commands to dem-dev's `scripts/sm-e2e.sh` when the selected
dem-dev revision provides it. It temporarily retains its original lifecycle implementation
as a compatibility fallback because the POC runtime lock predates that interface; after the
lock advances to a published dem-dev revision, the fallback can be deleted.

The current workflow still checks out `dem-dev`, `synthetic-monitoring-api`, and
`synthetic-monitoring-agent`. Their exact revisions are visible in
[`e2e/dem-dev/runtime.env`](../../e2e/dem-dev/runtime.env). This is transitional: the intended
runtime release replaces those three revisions with one version containing pinned runtime
images and a scenario runner with its agent collector compiled in.

## Local workflow

Point `DEM_DEV_ROOT` at an existing dem-dev checkout. Its `.env` must set:

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

> `yarn e2e:dem:seed` defaults to `DEM_E2E_CLEAN=true`. It wipes all Prometheus and Loki data
> owned by the selected dem-dev runtime before writing the scenario. Use a disposable runtime
> for isolation, or set `DEM_E2E_CLEAN=false` when intentionally appending to a developer stack.

The default scenario is `http-latency-spike`, rendered as 30 minutes of history ending at
the current time. Override it without changing test code:

```bash
DEM_E2E_SCENARIO=http-latency-spike \
DEM_E2E_DURATION_HOURS=1 \
yarn e2e:dem:seed
```

The browser test reads `artifacts/dem-dev/scenario.json`, finds the generated check by the
manifest's job name, verifies its target/frequency/probe topology, and opens its dashboard.

For the CI-shaped lifecycle, including cleanup:

```bash
DEM_DEV_ROOT=/path/to/dem-dev yarn e2e:dem
```

Set `DEM_E2E_KEEP_STACK=true` to retain a failed or successful stack for local inspection.
Otherwise failures capture per-container logs before teardown.

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
