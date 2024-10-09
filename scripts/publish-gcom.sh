#!/bin/bash
# This is used in Drone to generate the version string for automatic PR creation
set -eufo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
VERSION="$(grep version ${ROOT_DIR}/package.json | cut -d':' -f2 | tr -d "\"', \r")"

echo "${VERSION}"

curl -I https://grafana.com

#curl -f -w "status=%{http_code}" -s -H "Authorization: Bearer ${GRAFANA_API_KEY}" \
#-d "download[any][url]=https://storage.googleapis.com/synthetic-monitoring-app-prod/builds/${VERSION}/grafana-synthetic-monitoring-app-${VERSION}.zip" \
#-d "download[any][md5]=$$(curl -sL https://storage.googleapis.com/synthetic-monitoring-app-prod/builds/${VERSION}/grafana-synthetic-monitoring-app-${VERSION}.zip | md5sum | cut -d' ' -f1)" \
#-d url=https://github.com/grafana/synthetic-monitoring-app \
#"https://grafana.com/api/plugins"
