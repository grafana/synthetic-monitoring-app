#!/bin/bash
# This is used in Drone to generate the version string for automatic PR creation
set -eufo pipefail

ROOT_DIR=$(git rev-parse --show-toplevel)
V=$(grep version ${ROOT_DIR}/package.json | cut -d':' -f2 | tr -d "\"', \r")
HASH=$(git rev-parse --short HEAD)
VERSION="${V}-${HASH:0:8}"

echo "${VERSION}" > ${ROOT_DIR}/plugin_version.txt
echo "${VERSION}"