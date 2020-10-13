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
URL='https://github.com/grafana/synthetic-monitoring-app/releases/download/'"$GIT_TAG"'/grafana-synthetic-monitoring-app-'"${GIT_TAG//v}"'.zip'
PKG_SUM=$(curl -sL $URL | md5sum)
gcom /plugins \
  -d download[any][url]=$URL \
  -d download[any][md5]=$PKG_SUM \
	-d url=https://github.com/grafana/synthetic-monitoring-app

