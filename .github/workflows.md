# Workflows

## On creating a PR

1. Setup plugin environment and cache
2. Lint
3. Integration and unit tests
4. Check compatibility with latest Grafana API
5. Build and typecheck
6. Validate policy bot config

## On creating a PR that targets main

... all of the above
7. Check bundle size changes (DangerJS)

## When pushing to main

1. Publish TechDocs (if docs changed)
2. Release Please (manages releases and changelog)
3. Generate main bundle size artifact
4. **Deploy to dev** (automatic):
   - Build, sign, and zip plugin
   - Upload to GCS dev bucket (`grafanalabs-synthetic-monitoring-app-dev`)
   - Create deployment_tools PR that automatically merges
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
3. Create deployment_tools PR for dev environment that automatically merges
4. Updates dev wave in hosted Grafana

### Deploy to staging
Manually triggered via GitHub Actions (`dispatch_deploy-plugin.yml`)
Configuration: `environment: 'staging'`, `autoMerge: 'false'` (recommended)
1. Build, sign, and zip plugin
2. Upload to GCS prod bucket (`grafanalabs-synthetic-monitoring-app-prod`)
3. Create deployment_tools PR for staging environment
4. Updates staging wave in hosted Grafana

### Deploy to prod
Manually triggered via GitHub Actions (`dispatch_deploy-plugin.yml`)
Configuration: `environment: 'production'`, `autoMerge: 'false'` (recommended)
1. Create deployment_tools PR for prod environment
2. Updates prod wave in hosted Grafana

### Manual Release Please
Can be manually triggered via GitHub Actions to force a release-please run outside of the normal main branch commits.

## Release Process

1. Release Please automatically creates and maintains a release PR
2. When release PR is approved and merged:
   - Creates a GitHub release
   - Tags the version
   - Updates CHANGELOG.md

## Workflow Structure

The GitHub Actions setup uses reusable workflows:

- `on-pr-creation.yml` - Runs all PR checks
- `on-push-to-main.yml` - Handles main branch builds and deployments
- `dispatch_deploy-plugin.yml` - Manual deployment trigger for any environment
- `call_build-sign-upload-plugin.yml` - Builds, signs, and uploads plugin to GCS
- `call_deploy-plugin.yml` - Orchestrates deployment process
- `call_update-deployment-tools.yml` - Creates deployment_tools PRs
- `call_release-please.yml` - Handles release management (auto + manual)
- `call_publish-techdocs.yml` - Publishes documentation
- `call_main-bundle-size.yml` - Generates bundle size artifacts
- `call_dangerJS.yml` - Runs bundle size comparison and PR checks
- `call_build-and-typecheck.yml` - Builds plugin and runs TypeScript checks
- `call_env-setup.yml` - Sets up plugin environment and caching
- `call_lint.yml` - Runs linting
- `call_integration-tests.yml` - Runs tests
- `call_grafana-compat.yml` - Checks Grafana API compatibility
- `call_validate-policy-bot.yml` - Validates policy bot configuration
