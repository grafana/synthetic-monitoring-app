#!/bin/sh

# This script regenerates the HMAC for the drone.yaml file

set -e

if test -z "$DRONE_TOKEN"
then
    echo "Drone token not set. Usage:\nDRONE_TOKEN=<token> [DRONE_SERVER=<server>] $0"
    exit 1
fi

if test -z "$DRONE_SERVER"
then
    DRONE_SERVER=https://drone.grafana.net
fi

drone -s $DRONE_SERVER -t $DRONE_TOKEN sign grafana/synthetic-monitoring-app --save

exit 0
