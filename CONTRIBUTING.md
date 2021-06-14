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

Example provisioning files can be found in `/local-provisioning/datasources` and `/local-provisioning/plugins`

- Create a new `yaml` file in each of `datasources` and `plugins` (they can be named anything). Copy the content from each example file and uncomment everything. These files will be mounted as volumes in the Grafana docker container.
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

Grafana configuration can be adjusted using the `custom.ini` file located in `/scripts`. It defaults to development app mode, and has some feature toggles. Grafana will need to be restarted to pick up changes.

### Run

- Run `yarn watch`
- In a separate terminal window, run `./scripts/run-local.sh`. You can pass an optional `-v` flag to pick a specific version of Grafana to run. i.e. `./scripts/run-local.sh -v 8.0.1`
- Go to `localhost:3000`
- Changes to the plugin code require refreshing the browser. Changes to provisioning require restarting Grafana (which will happen if you just rerun the `run-local.sh` script).

### Running the entire stack locally

- See the instructions for [setting up the api](https://github.com/grafana/synthetic-monitoring-api/blob/main/DEVELOPMENT.md)
- Change the `apiHost` variable in your plugin provisioning yaml file to point at your locally running API
- You will need to run a private probe on your machine
- NOTE: This will still push data to Cloud
