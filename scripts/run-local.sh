#!/bin/bash

while getopts ":v:" flag; do
  case "${flag}" in
  v) 
    grafanaVersion=${OPTARG};;
  :)
    grafanaVersion='latest'
  esac
done

if [ ! $grafanaVersion ]; then
  echo 'No grafana version specified, using latest'
  grafanaVersion='latest'
  docker pull grafana/grafana-dev:latest
fi

NAME="grafana-dev-$grafanaVersion"

if [ "$(docker ps -q -f name=$NAME)" ]; then
  docker stop "$(docker ps -q -f name=$NAME)"
fi 

if [ "$(docker ps -aq -f name=$NAME)" ]; then
    # cleanup
    echo 'Deleting pre-existing container'
    docker rm $NAME
fi

if [ ! "$(docker volume ls -f name=grafana-storage)" ]; then
  docker volume create grafana-storage
fi


echo 'Starting up'

# run your container
docker run \
  -p 3000:3000 \
  -v "$(pwd):/var/lib/grafana/plugins/grafana-synthetic-monitoring-app" \
  -v "$(pwd)/scripts/local-provisioning:/etc/grafana/provisioning"  \
  -v "$(pwd)/scripts/custom.ini:/etc/grafana/grafana.ini"\
  -v grafana-storage:/var/lib/grafana \
  -e "GF_INSTALL_PLUGINS=grafana-worldmap-panel" \
  -t \
  --name="$NAME" \
  grafana/grafana-dev":$grafanaVersion"

