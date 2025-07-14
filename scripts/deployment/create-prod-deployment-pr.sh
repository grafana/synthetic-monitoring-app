#!/bin/bash

set -euo pipefail

# Determine branch prefix based on AUTO_MERGE setting
if [[ "${AUTO_MERGE:-false}" == "true" ]]; then
  BRANCH_PREFIX="auto-merge/synthetic-monitoring-plugin"
else
  BRANCH_PREFIX="ci/synthetic-monitoring-plugin"
fi

echo "AUTO_MERGE is set to: ${AUTO_MERGE:-false}"
echo "Using branch prefix: $BRANCH_PREFIX"

# Create the `config.json` file for the updater
echo "Generating config.json for updater..."
cat << EOF > config.json
{
  "repo_owner": "grafana",
  "repo_name": "deployment_tools",
  "destination_branch": "master",
  "pull_request_branch_prefix": "$BRANCH_PREFIX",
  "pull_request_enabled": true,
  "pull_request_existing_strategy": "ignore",
  "pull_request_message": "Triggered by Synthetic Monitoring App GitHub Actions. NOTE: prod does not refer directly to an environment it refers to stacks associated with the dev 'wave'. See [here](https://github.com/grafana/deployment_tools/blob/master/ksonnet/environments/hosted-grafana/waves/provisioned-plugins/README.md#waves) for more info.",
  "pull_request_reviewers": ["VikaCep", "ckbedwell", "w1kman"],
  "update_jsonnet_attribute_configs": [
    {
      "file_path": "ksonnet/environments/hosted-grafana/waves/provisioned-plugins/grafana-synthetic-monitoring-app/prod.libsonnet",
      "jsonnet_key": "version",
      "jsonnet_value_file": "plugin_version.txt"
    }
  ]
}
EOF

# Run the Docker-based updater tool
echo "Running updater Docker tool..."
docker run --rm \
  -v "$(pwd):/workspace" \
  -w /workspace \
  -e GITHUB_APP_ID="$GITHUB_APP_ID" \
  -e GITHUB_APP_INSTALLATION_ID="$GITHUB_APP_INSTALLATION_ID" \
  -e GITHUB_APP_PRIVATE_KEY="$GITHUB_APP_PRIVATE_KEY" \
  -e CONFIG_JSON="$(cat config.json)" \
  us-docker.pkg.dev/grafanalabs-global/docker-deployment-tools-prod/updater |& tee updater-output.log

echo "Updater process completed!"
