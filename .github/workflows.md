# Workflows

> **Note**: This project uses shared workflows from [grafana/plugin-ci-workflows](https://github.com/grafana/plugin-ci-workflows) for standard CI/CD operations.
> Documentation: https://enghub.grafana-ops.net/docs/default/component/grafana-plugins-platform/plugins-ci-github-actions/010-plugins-ci-github-actions

## On creating a PR

The `push.yml` workflow runs and performs:

**CI checks (via shared workflow):**
1. Setup plugin environment and cache
2. Lint (ESLint)
3. Integration and unit tests
4. Build and typecheck
5. Compatibility check with latest Grafana API

**SM-specific validations:**
6. Auto-label PR
7. Terraform configuration validation
8. Probe API server mappings verification
9. Grafana API compatibility check
10. Policy bot validation
11. Generate PR bundle size artifact
12. DangerJS (bundle size comparison and PR checks)

**Renovate PRs:**
- Renovate reviewer runs automatically for PRs from renovate[bot]

## When pushing to main

The `push.yml` workflow runs and performs:

**CI/CD (via shared workflow):**
1. All CI checks (lint, test, build, typecheck)
2. **Deploy to dev** (automatic):
   - Build, sign, and zip plugin
   - Upload to GCS dev bucket (`grafanalabs-synthetic-monitoring-app-dev`)
   - Publish to dev catalog (grafana-dev.com)
   - Create Argo CD workflow
   - Auto-merge deployment PR for dev environment
   - Post notification to `#sm-ops-deploys` Slack channel

**Additional main-branch jobs:**
3. Publish TechDocs to Backstage (if docs changed)
4. Release Please (manages releases and changelog)
5. Generate main bundle size artifact (for PR comparisons)
6. All SM-specific validations (same as PRs)

## Manual Deployments

Manual deployments are triggered via GitHub Actions (`publish.yml` workflow) with the following configuration options:

**Configuration Options:**

- `branch`: Branch to deploy from (default: 'main', can be used to deploy PRs to dev)
- `environment`: Deployment environment - 'dev', 'ops', or 'prod' (required)
- `docs-only`: Only publish docs, skip plugin deployment (optional, default: false)

### Deploy to dev (manual)

Manually triggered via GitHub Actions (`publish.yml`)

**Configuration:** 
- `branch`: main (or PR branch for testing)
- `environment`: dev
- `docs-only`: false

**Process:**
1. Build, sign, and zip plugin
2. Upload to GCS dev bucket (`grafanalabs-synthetic-monitoring-app-dev`)
3. Publish to dev catalog (grafana-dev.com)
4. Create Argo CD workflow
5. Auto-merge deployment PR (dev has auto-merge enabled)
6. Post notification to `#sm-ops-deploys`

### Deploy to ops (staging)

Manually triggered via GitHub Actions (`publish.yml`)

**Configuration:**
- `branch`: main
- `environment`: ops
- `docs-only`: false

**Process:**
1. Build, sign, and zip plugin
2. Upload to GCS prod bucket (`grafanalabs-synthetic-monitoring-app-prod`)
3. Publish to ops catalog (grafana-ops.com)
4. Create Argo CD workflow
5. Manual merge required for deployment PR
6. Post notification to `#sm-ops-deploys`

### Deploy to prod

Manually triggered via GitHub Actions (`publish.yml`)

**Configuration:**
- `branch`: main
- `environment`: prod
- `docs-only`: false

**Process:**
1. Build, sign, and zip plugin
2. Upload to GCS prod bucket (`grafanalabs-synthetic-monitoring-app-prod`)
3. Publish to prod catalog (grafana.com)
4. Create Argo CD workflow
5. Manual merge required for deployment PR
6. Post notification to `#sm-ops-deploys`

### Docs-only deployment

You can deploy only documentation updates without rebuilding/redeploying the plugin:

**Configuration:**
- `branch`: main (or docs branch)
- `environment`: dev/ops/prod
- `docs-only`: true

## Release Process

1. Release Please automatically creates and maintains a release PR
2. When release PR is approved and merged:
   - Creates a GitHub release
   - Tags the version
   - Updates CHANGELOG.md

## Workflow Structure

The GitHub Actions setup uses a combination of:
- **Shared workflows** from `grafana/plugin-ci-workflows` (standard CI/CD operations)
- **Local reusable workflows** for SM-specific validations and processes

### Core Workflows (Entry Points)

- `push.yml` - **Triggered on PRs and main branch pushes** - Unified CI/CD workflow
  - For PRs: Runs CI checks only (lint, test, build, typecheck)
  - For main: Runs CI checks + deploys to dev environment automatically
- `publish.yml` - **Manual trigger** - Deploy to any environment (dev/ops/prod)

### Shared Workflow

**`grafana/plugin-ci-workflows/.github/workflows/cd.yml@ci-cd-workflows/v4.3.0`**

This shared workflow handles all standard plugin CI/CD operations:
- Environment setup and caching
- Linting (ESLint)
- Testing (Jest integration and unit tests)
- Building and typechecking
- Signing plugin
- Uploading to GCS buckets
- Publishing to Grafana catalogs
- Creating Argo CD workflows
- Deployment orchestration

**Configuration for SM App:**
- `scopes: universal` - Supports both on-prem and cloud
- `grafana-cloud-deployment-type: provisioned` - Plugin is auto-provisioned
- `argo-workflow-slack-channel: #sm-ops-deploys` - Deployment notifications
- `auto-merge-environments: dev` - Auto-merge deployment PRs for dev
- `node-version: 22` - Node.js version
- `run-playwright: false` - Skip Playwright e2e tests

### SM-Specific Reusable Workflows

**Validation & Quality:**

- `call_auto-label.yml` - Auto-labels PRs based on changed files
- `call_validate-terraform.yml` - Validates generated Terraform configurations
- `call_verify-probe-api-server-mappings.yml` - Verifies probe API server mappings
- `call_grafana-compat.yml` - Checks compatibility with latest Grafana API
- `call_validate-policy-bot.yml` - Validates policy bot configuration
- `call_dangerJS.yml` - Runs bundle size comparison and PR checks
- `call_pr-bundle-size.yml` - Generates bundle size artifacts for PR comparison
- `call_main-bundle-size.yml` - Generates bundle size artifacts for main branch

**Release & Documentation:**

- `call_release-please.yml` - Handles release management (auto + manual)
- `call_publish-techdocs.yml` - Publishes documentation to Backstage

**Renovate Automation:**

- `call_renovate_reviewer.yml` - Auto-reviews and manages Renovate PRs
