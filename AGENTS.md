## Cursor Cloud specific instructions

### Overview

This is the **Grafana Synthetic Monitoring Frontend Application** — a Grafana Cloud plugin for blackbox monitoring. It supports HTTP, DNS, TCP, ICMP, k6 scripted, and k6 browser checks. See `CONTRIBUTING.md` for full contributor setup details.

### Key commands

Standard commands are in `package.json`:

| Task | Command |
|------|---------|
| Dev (watch + MSW mocks) | `yarn dev:msw` |
| Dev (watch, needs Cloud) | `yarn dev` |
| Lint | `yarn lint` |
| Lint fix | `yarn lint:fix` |
| Type check | `yarn typecheck` |
| Test (all) | `yarn test` |
| Test (CI) | `yarn test:ci` |
| Build | `yarn build` |
| Grafana server | `yarn server` (Docker) |

### Running the application locally

Two services are needed for local development:

1. **Webpack dev server** — `yarn dev:msw` (watches and rebuilds the plugin with MSW mocks enabled, no Grafana Cloud credentials needed)
2. **Grafana Docker container** — `yarn server` (starts Grafana on port 3000, mounts `./dist` as the plugin directory)

Both must run concurrently. The Webpack output goes into `dist/`, which Grafana loads live.

### Provisioning (gotcha)

The plugin will show "Invalid provisioning" unless provisioning YAML files exist in `dev/provisioning/datasources/` and `dev/provisioning/plugins/` (these are gitignored). For MSW-only dev, create minimal provisioning files based on the examples in those directories. Key fields:

- **Plugin provisioning** (`dev/provisioning/plugins/`): must include `jsonData.metrics.grafanaName`, `jsonData.logs.grafanaName`, `jsonData.stackId`, and `jsonData.apiHost`
- **Datasource provisioning** (`dev/provisioning/datasources/`): must define Loki and Prometheus datasources matching the `grafanaName` values above

After creating/changing provisioning files, restart Grafana (`yarn server` or `docker compose restart`).

### Node.js version

The project requires Node.js 24 (`.nvmrc`). Use `nvm use` or `nvm install 24`. Install dependencies with `yarn install --frozen-lockfile --ignore-engines` because `i18next-parser` does not yet declare Node 24 compatibility.

### Docker for Grafana

Docker is required for running the local Grafana instance. The `dev/license.jwt` file must exist (can be empty) or `docker compose` will fail to mount it. The Dockerfile is based on `grafana-enterprise`.

### MSW service worker gotcha

If you switch between `yarn dev:msw` and `yarn dev`, the MSW service worker persists in the browser and will intercept all API requests even in non-MSW mode. To fix: open Chrome DevTools > Application > Service Workers, find the `mockServiceWorker` and click Unregister, then hard-refresh (Ctrl+Shift+R).

### Testing notes

- `yarn test` runs the full Jest test suite (~170 suites, ~1300 tests).
- Tests use MSW handlers from `src/test/handlers` for API mocking.
- The test suite passes cleanly with no configuration needed beyond `yarn install`.
