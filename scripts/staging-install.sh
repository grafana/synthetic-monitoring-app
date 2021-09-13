#!/bin/bash

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

custom_commands() {
	PLUGIN_NAME='grafana-synthetic-monitoring-app'
	PACKAGE_VERSION=$(cat package.json \
		| grep version \
		| head -1 \
		| awk -F: '{ print $2 }' \
		| sed 's/[",]//g')

	URL="https://storage.googleapis.com/integration-artifacts/grafana-synthetic-monitoring-app/main/latest/grafana-synthetic-monitoring-app-${PACKAGE_VERSION}.any.zip"

	cat <<-EOF
		grafana-cli --pluginUrl=${URL} plugins install ${PLUGIN_NAME}
		mkdir -p /usr/share/grafana/conf/provisioning/plugins
		cat >/usr/share/grafana/conf/provisioning/plugins/syntheticmonitoring.yaml <<YAMLEOF
		apiVersion: 1
		apps:
		  - type: ${PLUGIN_NAME}
		    name: grafana-synthetic-monitoring-app
		    disabled: false
		    jsonData:
		      apiHost: ${STAGING_API_URL}
		      stackId: 141076
		      logs:
		        grafanaName: grafanacloud-syntheticmonitoring-logs
		        hostedId: 6539
		      metrics: 
		        grafanaName: grafanacloud-syntheticmonitoring-prom
		        hostedId: 15096
		    secureJsonData:
		      publisherToken: ${STAGING_PUBLISHER_TOKEN}
		YAMLEOF
	EOF
}


gcom /instances/syntheticmonitoring/config \
	-d config[hosted_grafana][custom_commands]="$(custom_commands)"

sleep 10s

# Restart so the syntheticmonitoring instance picks up changes
gcom /instances/syntheticmonitoring/restart -d ''
