# Workflows

## On creating a PR

1. Setup plugin environment and cache
2. Lint
3. Integration and unit tests
4. Check compatibility with latest Grafana API
5. Build and typecheck
6. Validate policy bot config

## On creating a PR that targets main

... all of the above 7. Check bundle size changes (DangerJS)

## When pushing to main

1. Publish TechDocs (if docs changed)
2. Release Please (manages releases and changelog)
3. Generate main bundle size artifact
4. **Deploy to dev** (automatic):
   - Build, sign, and zip plugin
   - Upload to GCS dev bucket (`grafanalabs-synthetic-monitoring-app-dev`)
   - Publish to dev catalog (grafana-dev.com)
   - Create deployment_tools PR (waits for catalog publishing to succeed)
   - Updates dev environment in hosted Grafana

## Manual Deployments

All manual deployments are triggered via GitHub Actions (`dispatch_deploy-plugin.yml`) with the following configuration options:

**Configuration Options:**

- `plugin_version`: The version of the plugin to deploy (required, default: 'latest')
- `environment`: Deployment environment - 'dev', 'staging', or 'production' (required, default: 'dev')
- `autoMerge`: Whether to automatically merge the deployment PR (optional, default: 'false')

### Deploy to dev (manual)

Manually triggered via GitHub Actions (`dispatch_deploy-plugin.yml`)
Configuration: `environment: 'dev'`, `autoMerge: 'true'` (recommended)

1. Build, sign, and zip plugin
2. Upload to GCS dev bucket (`grafanalabs-synthetic-monitoring-app-dev`)
3. Publish to dev catalog (grafana-dev.com)
4. Create deployment_tools PR (waits for catalog publishing to succeed)

### Deploy to staging

Manually triggered via GitHub Actions (`dispatch_deploy-plugin.yml`)
Configuration: `environment: 'staging'`, `autoMerge: 'true'` (recommended)

1. Build, sign, and zip plugin
2. Upload to GCS prod bucket (`grafanalabs-synthetic-monitoring-app-prod`)
3. Publish to ops catalog (grafana-ops.com)
4. Create deployment_tools PR (waits for catalog publishing to succeed)

### Deploy to prod

Manually triggered via GitHub Actions (`dispatch_deploy-plugin.yml`)
Configuration: `environment: 'production'`, `autoMerge: 'true'` (recommended)

1. Build, sign, and zip plugin
2. Upload to GCS prod bucket (`grafanalabs-synthetic-monitoring-app-prod`)
3. Publish to prod catalog (grafana.com)
4. Create deployment_tools PR (waits for catalog publishing to succeed)

### Manual Release Please

Can be manually triggered via GitHub Actions to force a release-please run outside of the normal main branch commits.

## Release Process

1. Release Please automatically creates and maintains a release PR
2. When release PR is approved and merged:
   - Creates a GitHub release
   - Tags the version
   - Updates CHANGELOG.md

## Workflow Structure

The GitHub Actions setup uses reusable workflows organized into these categories:

### Core Workflows (Entry Points)

- `on-pr-creation.yml` - **Triggered on PR creation** - Runs all PR validation checks
- `on-push-to-main.yml` - **Triggered on main branch push** - Handles builds and auto-deployment
- `dispatch_deploy-plugin.yml` - **Manual trigger** - Deployment to any environment

### Reusable Workflow Components

**Build & Test:**

- `call_env-setup.yml` - Sets up plugin environment and caching
- `call_lint.yml` - Runs ESLint checks
- `call_integration-tests.yml` - Runs Jest integration and unit tests
- `call_build-and-typecheck.yml` - Builds plugin and runs TypeScript checks
- `call_grafana-compat.yml` - Checks compatibility with latest Grafana API

**Quality & Analysis:**

- `call_dangerJS.yml` - Runs bundle size comparison and PR checks
- `call_main-bundle-size.yml` - Generates bundle size artifacts for comparison
- `call_validate-policy-bot.yml` - Validates policy bot configuration

**Deployment & Release:**

- `call_build-sign-upload-plugin.yml` - Builds, signs, and uploads plugin to GCS
- `call_deploy-plugin.yml` - Orchestrates deployment process with environment-specific jobs
- `call_update-deployment-tools.yml` - Creates deployment_tools PRs
- `call_release-please.yml` - Handles release management (auto + manual)

**Documentation:**

- `call_publish-techdocs.yml` - Publishes documentation to Backstage
