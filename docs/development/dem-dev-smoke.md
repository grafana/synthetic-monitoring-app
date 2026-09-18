# dem-dev CI smoke

The [workflow](../../.github/workflows/validate-dem-dev-e2e.yml) builds this PR's
plugin, starts dem-dev and runs one Chromium test. The test finds an HTTP check
provisioned through the real SM API, verifies its job and target, reloads the page
and verifies them again.

The runtime selection lives in [`.github/dem-dev.yaml`](../../.github/dem-dev.yaml):
SM enabled, Simnet off, one `sm/http-check` fixture. The generic dem-dev setup action
uses this repository's actual checkout commit, plus its pinned runtime baseline.
Other repository commits can be selected through the config's `sources` mapping.

The app owns dependency installation, frontend/backend compilation, Chromium and
test assertions. dem-dev owns runtime readiness, fixture provisioning, diagnostic
collection and cleanup. `artifact-path: dist` lets setup reuse our build. The test
is an ordinary workflow step using `GRAFANA_URL` and `DEM_FIXTURES_FILE`; it does
not pass a test command into the action.

Source access uses the existing scoped GitHub App token. GAR access uses Workload
Identity. The workflow's `validate-dem-dev-e2e.yml` filename must remain unchanged
because it is bound to the `dem-dev-e2e-read` Vault role. The job runs on standard
`ubuntu-latest` for same-repository PRs, which can access the private dependencies.

An explicit cleanup step collects runtime logs before the report upload. The
setup action also registers automatic post-job cleanup for failures and
cancellation. Artifacts include the fixture manifest, resolved source/image
manifest, runtime logs and Playwright report.

## Rollout dependency

This integration requires [deployment_tools #722465](https://github.com/grafana/deployment_tools/pull/722465)
to be approved and applied, followed by the first dem-dev runtime publication and
image-manifest pin. Update the dem-dev checkout SHA to the commit containing those
pins before expecting a green hosted smoke run. Until then, setup reports the
missing image manifest rather than building the baseline from source.

The original smoke test passed locally and on hosted CI. Those runs used the
source-build wrapper; they do not prove the new registry-backed integration. A
fresh hosted run is required after publication. Live probe execution, historical
telemetry, dashboard values and alerting remain outside this smoke test's scope.
