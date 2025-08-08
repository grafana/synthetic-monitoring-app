#!/bin/bash
set -eufo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
VERSION="$(grep version ${ROOT_DIR}/package.json | cut -d':' -f2 | tr -d "\"', \r")"
DEV_GCS_URL="https://storage.googleapis.com/grafanalabs-synthetic-monitoring-app-dev/builds/${VERSION}/grafana-synthetic-monitoring-app-${VERSION}.zip"

curl -f -w "status=%{http_code}" -s -H "Authorization: Bearer ${GCOM_PUBLISH_TOKEN}" \
-d "download[any][url]=$DEV_GCS_URL" \
-d "download[any][md5]=$$(curl -sL $DEV_GCS_URL | md5sum | cut -d' ' -f1)" \
-d url=https://github.com/grafana/synthetic-monitoring-app \
"https://grafana-dev.com/api/plugins"
