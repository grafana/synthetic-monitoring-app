#!/bin/bash
set -eufo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
VERSION="$(grep version ${ROOT_DIR}/package.json | cut -d':' -f2 | tr -d "\"', \r")"

echo "${VERSION}"

OPS_GCS_URL="https://storage.googleapis.com/grafanalabs-synthetic-monitoring-app-prod/builds/${VERSION}/grafana-synthetic-monitoring-app-${VERSION}.zip"

echo "Making API call..."
response=$(curl -w "status=%{http_code}" -H "Authorization: Bearer ${GCOM_PUBLISH_TOKEN}" \
-d "download[any][url]=$OPS_GCS_URL" \
-d "download[any][md5]=$$(curl -sL $OPS_GCS_URL | md5sum | cut -d' ' -f1)" \
-d url=https://github.com/grafana/synthetic-monitoring-app \
"https://grafana-ops.com/api/plugins" 2>&1)

echo "Full response:"
echo "$response"

if [[ "$response" == *"status=500"* ]]; then
  echo "Server returned 500 error"
  exit 1
fi
