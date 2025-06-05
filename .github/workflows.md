# Workflows

## On creating a PR

1. Install dependencies
2. Lint
3. Typecheck
4. Test
5. Check compatibility with latest Grafana API
6. Validate policy bot config

## On creating a PR that targets main

... all of the above
7. Checks bundle size changes

## When committing to main

... all of the above
9. Updates bundle size artifact
10. Publishes techdocs

*(Deploys to dev)*
8. Signs using grafana signing
9. zips the package to latest.zip
10. uploads to GCP dev bucket
11. opens deployment_tools PR that automatically merges
12. updates release-please PR with new changes

## When creating a release

1. Approve release-please PR

### Deploys to staging
1. Trigger GitHub action (needed?)
2. Signs using grafana signing
3. zips the package to latest.zip
4. uploads to GCP **prod** bucket
5. opens deployment_tools PR that automatically merges

### Deploying to prod (requires staging to be deployed first)
1. Trigger GitHub action
2. opens deployment_tools PR that automatically merges
