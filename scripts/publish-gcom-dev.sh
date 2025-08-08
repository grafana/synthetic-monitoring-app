#!/bin/bash
set -eufo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)

# Use the same version format as generate-version script
if [ -f "${ROOT_DIR}/plugin_version.txt" ]; then
  VERSION=$(cat "${ROOT_DIR}/plugin_version.txt")
else
  # Fallback to generating it manually
  BASE_VERSION="$(grep version ${ROOT_DIR}/package.json | cut -d':' -f2 | tr -d "\"', \r")"
  COMMIT_HASH="$(git rev-parse --short HEAD)"
  VERSION="${BASE_VERSION}-${COMMIT_HASH:0:8}"
fi

DEV_GCS_URL="https://storage.googleapis.com/grafanalabs-synthetic-monitoring-app-dev/builds/grafana-synthetic-monitoring-app-latest.zip"

echo "Making API call..."
response=$(curl -w "status=%{http_code}" -H "Authorization: Bearer ${GCOM_PUBLISH_TOKEN}" \
-d "download[any][url]=$DEV_GCS_URL" \
-d "download[any][md5]=$$(curl -sL $DEV_GCS_URL | md5sum | cut -d' ' -f1)" \
-d url=https://github.com/grafana/synthetic-monitoring-app \
"https://grafana-dev.com/api/plugins" 2>&1)

echo "Full response:"
echo "$response"

if [[ "$response" == *"status=500"* ]]; then
  echo "Server returned 500 error"
  exit 1
fi
