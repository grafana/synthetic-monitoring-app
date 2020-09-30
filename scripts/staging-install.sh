#!/bin/sh

fail() {
	echo error: "$@" 1>&2
	exit 1
}


gcom() {
	url="https://grafana.com/api${1}"
	shift
	ret=$(curl -s -H "Authorization: Bearer ${GCOM_TOKEN}" "$url" "$@")
	if [ "$ret" = "true" ]; then
		echo true
		return
	fi
	if echo "$ret" | jq -e .code > /dev/null; then
		code=$(echo "$ret" | jq -r .code)
		msg=$(echo "$ret" | jq -r .message)
		fail "${code}: ${msg}"
	else
		echo "$ret"
	fi
}

GIT_TAG=$(git tag --points-at HEAD)
#remove the leading v on the git tag
TAG="${GIT_TAG//v}"

INSTALL_COMMAND='grafana-cli plugins remove grafana-synthetic-monitoring-app; grafana-cli --pluginUrl='"https://github.com/grafana/synthetic-monitoring-app/releases/download/v$TAG/grafana-synthetic-monitoring-app-$TAG.zip"' plugins install grafana-synthetic-monitoring-app'

gcom /instances/syntheticmonitoring/config \
    -d config[hosted_grafana][custom_commands]="$INSTALL_COMMAND"

sleep 10s

gcom /instances/syntheticmonitoring/restart -d ''