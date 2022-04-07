#!/bin/bash

set -e

# make sure we have lastest linter
go install github.com/grafana/dashboard-linter@latest

# check if we have it
which dashboard-linter

# get all dashboards
dashboards=$(ls ./src/dashboards/*.json)

for dash in ${dashboards} ; do
  echo "Linting: ${dash}"
  dashboard-linter lint ${dash}
  echo "-------------------------------------"
done
