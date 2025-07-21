# Probe API Server Mappings Scripts

This directory contains scripts to manage the `probeAPIServerMappings.json` file that is used in the Synthetic Monitoring app for private probe configuration.

## Scripts

### build-probe-api-mappings.ts

This script automatically updates the `probeAPIServerMappings.json` file with the latest probe mappings from the [Grafana documentation](https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/#add-a-new-probe-in-your-grafana-instance).

**Usage:**
```bash
yarn build:probe-api-mappings
```

**What it does:**
1. Fetches the latest HTML from the Grafana documentation
2. Parses the probe mappings table
3. Compares with the current JSON file
4. Shows detailed changes that will be made
5. Updates the file with the latest mappings
6. Provides feedback on what was changed

**Example output:**
```
🔧 Building probe API server mappings...
📄 Fetching documentation from: https://grafana.com/docs/...
📊 Found 24 entries in documentation
📊 Found 23 entries in current file
🔄 Probe API server mappings need to be updated!

📋 Changes to be made:
🗑️  Will remove: Australia2 (AWS)
➕ Will add: Australia (AWS)
➕ Will add: Brazil (GCP)

🔧 Updating mappings file...
✅ Successfully updated src/page/NewProbe/probeAPIServerMappings.json
🎉 Probe API server mappings have been successfully updated!
```

### verify-probe-api-mappings.ts

This script verifies that the `probeAPIServerMappings.json` file is up to date with the Grafana documentation. It's used in CI/CD to ensure the mappings don't drift from the documentation.

**Usage:**
```bash
yarn verify:probe-api-mappings
```

**What it does:**
1. Fetches the latest HTML from the Grafana documentation
2. Parses the probe mappings table
3. Compares with the current JSON file
4. Reports any differences found
5. Exits with code 0 if up to date, code 1 if outdated

**Example output when outdated:**
```
🔍 Verifying probe API server mappings...
📊 Found 24 entries in documentation
📊 Found 23 entries in current file
❌ Probe API server mappings are outdated!

📋 Comparison Results:
❌ Missing in current file: Australia (AWS)
❌ Missing in current file: Brazil (GCP)
❌ Extra in current file: Australia2 (AWS)
```

## Workflow Integration

The verification script is automatically run on pull requests via GitHub Actions. If the mappings are outdated, it will:
- Fail the CI check
- Post a comment on the PR with the detailed differences
- Provide instructions on how to fix the issue

To fix outdated mappings detected by CI:
1. Run `yarn build:probe-api-mappings` locally
2. Commit the updated file
3. Push to update the PR

## Architecture

The scripts are organized as follows:
- `utils.ts` - Shared utility functions and constants used by both scripts
- `build-probe-api-mappings.ts` - Script to update the mappings file
- `verify-probe-api-mappings.ts` - Script to verify the mappings file

### utils.ts

Contains the shared functions and constants:
- `DOCUMENTATION_URL` - URL to the Grafana documentation page
- `MAPPINGS_FILE` - Path to the JSON mappings file
- `ProbeMapping` - TypeScript interface for probe mapping objects
- `fetchDocumentationPage()` - Fetches HTML from documentation
- `parseProbeTableFromHtml()` - Parses the HTML table to extract mappings
- `loadCurrentMappings()` - Loads current mappings from the JSON file
- `compareMappings()` - Compares two mapping arrays for equality

## Dependencies

Both scripts require:
- `jsdom` for HTML parsing
- `@types/jsdom` for TypeScript support

These are already included in the project's `devDependencies`. 