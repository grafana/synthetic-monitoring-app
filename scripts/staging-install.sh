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

custom_commands() {
	URL=https://storage.cloud.google.com/integration-artifacts/grafana-synthetic-monitoring-app/canary/grafana-synthetic-monitoring-app.zip
	plugin_id=grafana-synthetic-monitoring-app

	cat <<-EOF
		grafana-cli --pluginUrl=${URL} plugins install ${plugin_id}
		mkdir -p /usr/share/grafana/conf/provisioning/plugins
		cat >/usr/share/grafana/conf/provisioning/plugins/syntheticmonitoring.yaml <<YAMLEOF
		apiVersion: 1
		apps:
		  - type: ${plugin_id}
		    name: grafana-synthetic-monitoring-app
		    disabled: false
		    jsonData:
		      apiHost: https://worldping-api-dev.grafana.net
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


PLUGIN_NAME='grafana-synthetic-monitoring-app'
GIT_TAG=$(git tag --points-at HEAD)
#remove the leading v on the git tag
VERSION="${GIT_TAG//v}"

# if [ -z "${GCLOUD_SERVICE_KEY}" ]; then
# 	echo "Missing GCS Publish Key"
# 	exit -1
# fi

# echo ${GCLOUD_SERVICE_KEY} | gcloud auth activate-service-account --key-file=-

URL="https://github.com/grafana/synthetic-monitoring-app/releases/download/v$VERSION/grafana-synthetic-monitoring-app-$VERSION.zip"

# Download built assets from Github
# mkdir -p ./ci/builds
# curl -L -o ./ci/builds/$GIT_TAG.zip $URL

# Push assets to GCS in version folder
# gsutil -m cp -r "./ci/builds/$GIT_TAG.zip" "gs://integration-artifacts/$PLUGIN_NAME/$VERSION/$PLUGIN_NAME.zip"
# Also put the assets in canary for use with staging/dev
# gsutil -m cp -r "./ci/builds/$GIT_TAG.zip" "gs://integration-artifacts/$PLUGIN_NAME/canary/$PLUGIN_NAME.zip"

# Set syntheticmonitoring instance to use the canary plugin version
# gcom /instances/syntheticmonitoring/config \
#     -d config[hosted_grafana][custom_commands]="$(custom_commands)"

gcom /instances/syntheticmonitoring/config \
	-d config[hosted_grafana][custom_commands]="grafana-cli --pluginUrl=${URL} plugins install ${PLUGIN_NAME}"

sleep 10s

# Restart so the syntheticmonitoring instance picks up changes
gcom /instances/syntheticmonitoring/restart -d ''
