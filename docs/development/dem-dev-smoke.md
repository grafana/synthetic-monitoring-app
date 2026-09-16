# dem-dev CI smoke

The [workflow](../../.github/workflows/dem-dev-smoke.yml) pins dem-dev's
`.github/actions/sm-e2e` implementation by commit SHA. The runtime and browser
test have been exercised locally; the pull request workflow validates the same
interface on a hosted runner.

## First milestone

A pull request builds this plugin, starts an isolated dem-dev SM runtime, and runs
one Chromium test. The test finds a check provisioned through the real SM API,
verifies its job name and target, reloads the page, and verifies them again.

This covers plugin loading, provisioning and reading persisted check data through
the real API. Live probe execution, historical telemetry, dashboard values,
feature-flag variations and alerting are follow-up work.

## App-owned setup

The workflow installs the app dependencies and Chromium, builds the frontend and
the nested datasource's Linux backend, then checks out one pinned dem-dev commit.
It uses the existing scoped GitHub App token for private repository access. The
first workflow runs on same-repository pull requests.

The app calls the action with three inputs:

| Input          | Meaning                                                                          |
| -------------- | -------------------------------------------------------------------------------- |
| `plugin-dist`  | Absolute path to this PR's built `dist/`, including the Linux datasource binary. |
| `github-token` | Scoped token for dem-dev's private runtime dependencies.                         |
| `test-command` | `yarn e2e:dem`, executed from the app checkout with its installed dependencies.  |

The app owns the [test](../../e2e/smoke.spec.ts), its assertions and Playwright
report. It uploads `artifacts/` after the action, including on failure.

## dem-dev-owned behavior

The action is responsible for:

1. Resolve its pinned, compatible runtime dependencies and install the tools it
   needs. Consumers select only the dem-dev commit.
2. Start an isolated SM runtime with the supplied plugin mounted, local auth and
   datasource provisioning. Disable live probes, Simnet, alerts, FEO and background
   traffic for this smoke test.
3. Wait for the app and nested datasource to load, datasource health to pass, and
   the SM API to be usable. Use dem-dev's existing anonymous Grafana access.
4. Provision one disabled HTTP check and any required probe records through the
   real SM API, then confirm the check can be read back. Historical data is not
   required. Pass the fixture identity to the consumer command:

   | Environment variable     | Meaning                                        |
   | ------------------------ | ---------------------------------------------- |
   | `GRAFANA_URL`            | URL of this run's ready Grafana instance.      |
   | `DEM_SMOKE_CHECK_JOB`    | Unique job name of the provisioned HTTP check. |
   | `DEM_SMOKE_CHECK_TARGET` | Exact target stored for that check.            |

5. Run `test-command`, save runtime diagnostics to the app's `artifacts/dem-dev/`
   on failure, and tear down its own resources on success or failure, including
   partial startup. Preserve the test's failure status; fail on cleanup errors
   when the test succeeded. Handle cancellation with best-effort cleanup.

The action reuses `scripts/sm-e2e.sh` with a smoke profile and pins its API source
checkout and runtime images. Source builds remain an internal detail. Cleanup
targets only its Compose project, and resolved configuration containing runtime
credentials is excluded from the artifacts.

## Validation

Local validation has exercised a passing browser test and an intentionally
failing assertion, including diagnostics and teardown. Hosted CI additionally
checks private repository access and report upload. Cancellation cleanup is
best-effort and needs separate verification on the hosted runner.
