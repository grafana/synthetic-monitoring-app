# Contributing to this repository

## Getting started

There are two different "modes" for developing this plugin. You can either work on just the plugin, pointed at Grafana cloud (easier to set up), or if you need to work across the entire stack you'll need to set up all the dependent components.

### Dependencies

- Set up a Grafana Cloud account
- Make sure you have Docker installed
- Pull this repo to your local machine

### Set up

We need to configure our local Grafana using provisioning. Provisioning does three things for us:

- Installs and enables the plugin in Grafana
- Creates the necessary datasources
- Provides some data to the plugin so it knows how to connect to the SM API and Cloud.

Example provisioning files can be found in `dev/provisioning/datasources` and `dev/provisioning/plugins`

- Create new `yaml` files in `dev/provisioning/datasources` and `dev/provisioning/plugins` folders (they can be named anything).
- Copy the content from each example file and uncomment everything. These files will be mounted as volumes in the Grafana docker container.
- Fill in the values for the provisioning files.
  - Datasource info:
    - You'll need to input the basicAuthUser and password. You can find this information by going to your cloud portal, and copying the user info from the prometheus/loki datasource config UI
    - The password should be a grafana.com api key
    - The `name` can be anything, it just has to match what you pass as the `grafanaName` in your plugin provisioning file
  - Plugin info:
    - stackId can be found using `gcom /instances/<orgSlug>`, or by visiting `https://grafana.com/orgs/<orgSlug>/stacks` and clicking the `details` button on stack you are connecting to. The id will be in the URL.
    - The `logs` and `metrics` section are instructing the plugin which datasources it needs to use.
      - The `grafanaName` needs to exactly match the names specified in your datasource provisioning
      - The `hostedId` is the same value as the `basicAuthUser` in your datasource provisioning
      - `publisherToken` needs to be a grafana.com api key with a `MetricsPublisher` role. This is what the probes use to publish metrics to your cloud stack.

Grafana configuration can be adjusted using the `custom.ini` file located in `/dev`. It defaults to development app mode, and has some feature toggles. Grafana will need to be restarted to pick up changes.

### Run

- Run `yarn dev`
- In a separate terminal window, run `yarn server`. You can pick a specific version of Grafana to run by setting the `GRAFANA_VERSION` environment variable
- Go to `localhost:3000`
- Changes to the plugin code will hot reload. Changes to provisioning require restarting Grafana (which will happen if you just rerun the `yarn server` command).

### Running the entire stack locally

- See the instructions for [setting up the api](https://github.com/grafana/synthetic-monitoring-api/blob/main/DEVELOPMENT.md)
- Change the `apiHost` variable in your plugin provisioning yaml file to point at your locally running API. To allow docker to reach your local API URL, you need to provision the Synthetic Monitoring app with `apiHost: http://host.docker.internal:4030`.
- You will need to run a private probe on your machine
- NOTE: This will still push data to Cloud
