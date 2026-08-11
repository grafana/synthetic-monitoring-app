## Cursor Cloud specific instructions

### Overview

This is the **Grafana Synthetic Monitoring Frontend Application** — a Grafana Cloud plugin for blackbox monitoring. It supports HTTP, DNS, TCP, ICMP, k6 scripted, and k6 browser checks. See `CONTRIBUTING.md` for full contributor setup details.

### Key commands

Standard commands are in `package.json`:

| Task                     | Command                                             |
| ------------------------ | --------------------------------------------------- |
| Dev (watch + MSW mocks)  | `yarn dev:msw`                                      |
| Dev (watch, needs Cloud) | `yarn dev`                                          |
| Lint                     | `yarn lint`                                         |
| Lint fix                 | `yarn lint:fix`                                     |
| Type check               | `yarn typecheck`                                    |
| Test (all)               | `yarn test`                                         |
| Test (CI)                | `yarn test:ci`                                      |
| Build                    | `yarn build`                                        |
| Grafana server           | `yarn server` (Docker; builds the Go backend first) |

### Backend (Go)

The plugin has a Go backend under `pkg/`. It currently only starts up and reports
its health — it exposes no resources and no frontend code calls it.

Backend tooling lives in `Magefile.go` under the `go:` namespace, because the
`grafana-plugin-sdk-go` build package already occupies the top-level target names
(`lint`, `test`, `testRace`, `buildAll`, ...); defining a local `Lint` is a mage
parse error, not an override. Run `mage -l` to list everything.

| Task                                      | Command                                                       |
| ----------------------------------------- | ------------------------------------------------------------- |
| Lint backend (`go vet` + golangci-lint)   | `mage go:lint` (or `make lint-go`)                            |
| Test backend (race detector)              | `mage -v testRace` (or `make test-go`)                        |
| Validate backend loads in Grafana         | `./scripts/validate-backend` (or `make validate-backend`)     |
| Build backend (all platforms)             | `mage -v buildAll` (or `yarn build:backend`, `make build-go`) |
| Build backend (host only)                 | `mage -v build:backend`                                       |
| Tidy dependencies                         | `mage -v go:tidy`                                             |
| Check go.mod vs toolchain                 | `mage go:verifyVersion`                                       |
| Check for uncommitted go.mod/go.sum drift | `mage go:enforceClean`                                        |

`make lint`, `make test` and `make build` depend on `lint-go`/`test-go`/
`build-go`, so they cover the frontend and the backend; everything else
backend-related is a `mage` target only, deliberately not wrapped in the
Makefile.

The `yarn` scripts, the Makefile targets and CI all invoke mage as `go run
github.com/magefile/mage` rather than a bare `mage`, because mage is a module
dependency: `go run` uses the version pinned in `go.mod` and contributors need no
separate install. This matters beyond convenience — a globally installed `mage`
is usually a different version than the pinned one, so bare invocations can
diverge from CI silently.

The tables above show bare `mage` for brevity. If you have it installed, prefer
`go run github.com/magefile/mage` (or the `make` wrappers) when a result needs to
match CI.

Two rules worth knowing:

- **Always scope Go commands to `./pkg/...`, never `./...`.** `node_modules`
  contains Go files that produce unactionable golangci-lint failures. The SDK's
  own `mage lint` target uses `./...`, so avoid it in favour of `mage go:lint`.
- **CI does not use the Makefile for Go.** The shared workflow
  (`grafana/plugin-ci-workflows`) detects the backend purely by the presence of
  `Magefile.go`, then runs `golangci-lint run --timeout=5m`, `mage -v testRace`
  and `mage -v buildAll` itself. `.golangci.yaml` is picked up because
  golangci-lint discovers it at the repository root.
- **CI's lint step is broader than the local one.** It passes no package
  argument, so it lints `./...`, and it runs in the same job _after_ the
  frontend action has installed `node_modules`. The `paths` exclusions in
  `.golangci.yaml` are what keep that green. A clean `mage go:lint` is therefore
  necessary but not sufficient — it cannot catch a regression caused by removing
  those exclusions.

`.golangci.yaml` intentionally mirrors the configuration in
`grafana/synthetic-monitoring-api` so Go code reads the same across Synthetic
Monitoring repositories. This is a much larger linter set than the
`plugin-tools` scaffold ships; changes should be considered for both repos.

### Running the application locally

Two services are needed for local development:

1. **Webpack dev server** — `yarn dev:msw` (watches and rebuilds the plugin with MSW mocks enabled, no Grafana Cloud credentials needed)
2. **Grafana Docker container** — `yarn server` (builds the Go backend, then starts Grafana on port 3000, mounting `./dist` as the plugin directory)

Both must run concurrently. The Webpack output goes into `dist/`, which Grafana loads live.

`dist/` must contain **both** halves: the webpack bundle and a
`gpx_sm_app_<os>_<arch>` binary matching the _container's_ platform. `yarn
server` runs `yarn build:backend` first so this holds automatically; Go is
therefore a prerequisite for running Grafana locally, even for frontend-only
work.

If the binary is missing, Grafana does not merely disable the backend — it drops
the plugin entirely, frontend included, because registration happens after the
backend process starts. The symptom is the app silently missing from the nav,
with this in the Grafana logs:

```
level=error msg="Could not start plugin backend" error="fork/exec .../gpx_sm_app_linux_amd64: no such file or directory"
level=error msg="Could not initialize plugin"
```

Webpack will not clobber the binaries on rebuild: `.config/webpack/webpack.config.ts`
sets `output.clean.keep` to preserve `gpx_*` and `go_plugin_build_manifest`.

To verify the backend is actually running against an instance you already have
up:

```
curl -u admin:admin localhost:3000/api/plugins/grafana-synthetic-monitoring-app/health
# {"message":"ok","status":"OK"}
```

This needs no provisioning or Grafana Cloud credentials — provisioning only
gates whether the app UI can reach the SM API, not whether the plugin loads.

To check the backend from scratch without touching a running instance, use
`./scripts/validate-backend`. It builds the binary, starts a throwaway Grafana
in its own compose project on port 3199, asserts that the plugin registered and
that `CheckHealth` answers, then tears everything down. `SKIP_BUILD=1` validates
the existing `dist/` instead of rebuilding.

### Provisioning (gotcha)

The plugin will show "Invalid provisioning" unless provisioning YAML files exist in `dev/provisioning/datasources/` and `dev/provisioning/plugins/` (these are gitignored). For MSW-only dev, create minimal provisioning files based on the examples in those directories. Key fields:

- **Plugin provisioning** (`dev/provisioning/plugins/`): must include `jsonData.metrics.grafanaName`, `jsonData.logs.grafanaName`, `jsonData.stackId`, and `jsonData.apiHost`
- **Datasource provisioning** (`dev/provisioning/datasources/`): must define Loki and Prometheus datasources matching the `grafanaName` values above

After creating/changing provisioning files, restart Grafana (`yarn server` or `docker compose restart`).

### Node.js version

`.nvmrc` pins Node.js 24 (`nvm use`, or `nvm install 24`), but note that CI
builds and publishes on Node 22 (`node-version: 22` in `validate_pr.yml` and
`publish.yml`), and the repo builds cleanly on 22. Treat `.nvmrc` as the
preferred version, not a hard requirement.

Install dependencies with `yarn install --immutable`. This repo is on Yarn 4
(`packageManager` in `package.json`, resolved via `yarnPath` in `.yarnrc.yml`),
so no corepack setup is needed. `--frozen-lockfile` and `--ignore-engines` are
Yarn 1 flags and do not exist here; `package.json` declares no `engines` field,
so there is nothing to ignore. Peer-dependency warnings on install are expected
and non-fatal.

After installing, run `yarn prepare` once to set up git hooks (lifecycle scripts
are disabled in `.yarnrc.yml` for supply-chain security).

### Docker for Grafana

Docker is required for running the local Grafana instance. The `dev/license.jwt` file must exist (can be empty) or `docker compose` will fail to mount it. The Dockerfile is based on `grafana-enterprise`.

`.config/docker-compose-base.yaml` hardcodes `container_name`, so only one
checkout of this repo can run Grafana at a time. Changing the port does not
help, and the failure mode is worse than a clean error:

- If the other checkout's container merely holds the name, `docker compose up`
  refuses to start with `Conflict. The container name
"/grafana-synthetic-monitoring-app" is already in use`.
- If your own compose project already has a container for the service (for
  example because a previous run used an override with a different
  `container_name`), `up` performs a _recreate_ instead. On recreate, compose
  resolves the name conflict by renaming the other checkout's container out of
  the way and **stopping it** — silently taking down a Grafana you were using
  elsewhere.

When working in a git worktree, either stop the other container first, or run
with an override that supplies a distinct `container_name` _and_ a distinct
compose project name (`-p`). `scripts/validate-backend` does exactly this and is
worth copying as a pattern.

### MSW service worker gotcha

If you switch between `yarn dev:msw` and `yarn dev`, the MSW service worker persists in the browser and will intercept all API requests even in non-MSW mode. To fix: open Chrome DevTools > Application > Service Workers, find the `mockServiceWorker` and click Unregister, then hard-refresh (Ctrl+Shift+R).

### Testing notes

See [docs/development/testing.md](./docs/development/testing.md) for the full testing guide — expectations, pseudo-e2e philosophy, and how to use `src/test/`.

Agent skill (auto-trigger workflow): [`.agents/skills/write-tests/SKILL.md`](./.agents/skills/write-tests/SKILL.md). Cursor and other Agent Skills-compatible tools read `.agents/skills/` directly; Claude Code uses the symlink at `.claude/skills/write-tests`.

- `yarn test` runs the full Jest test suite (~170 suites, ~1300 tests).
- `yarn test <filename>` runs a single file; `yarn test:changed` watches changed files.
- Tests use MSW handlers from `src/test/handlers` for API mocking.
- The test suite passes cleanly with no configuration needed beyond `yarn install`.
