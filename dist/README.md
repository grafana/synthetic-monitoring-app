# Synthetic monitoring application

Synthetic Monitoring is a blackbox monitoring solution provided as part of [Grafana Cloud](https://grafana.com/products/cloud/).
Synthetic Monitoring provides users with insights into how their applications and services are behaving from an external point of view.
Users can define checks to continually test remote targets from 1 or more probe locations around the world to assess the availability, performance and correctness of the services. As each check runs, metrics and logs are collected and published to the user's Grafana Cloud service. Metrics are published to Grafana Cloud Prometheus and logs are published to Grafana Cloud Loki.

Synthetic monitoring is the successor to the original [worldping application](https://grafana.net/plugins/raintank-worldping-app).
The refreshed Synthetic Monitoring product focuses on reducing complexity and taking advantage of Grafana Cloud capabilities.

### Check Types

Users can define HTTP/HTTPS, DNS, TCP and ICMP Ping checks to monitor their remote targets. Internally, the Synthetic Monitoring solution uses the [Prometheus Blackbox exporter](https://github.com/prometheus/blackbox_exporter) for executing the checks and collecting metrics and logs. When creating a check, users are able to customize the settings and validation rules supported by the Blackbox exporter.

### Probe Locations

For each check, users can select 1 or more 'public' probe locations distributed throughout the world to run tests from. Additionally, users can run their own 'private' probe locations by downloading and deploying the [Synthetic Monitoring Agent](https://github.com/grafana/synthetic-monitoring-agent).

### Configuration

Synthetic Monitoring requires a Grafana Cloud account, but can be set up to run in a local Grafana instance in two ways:

#### Via an admin key

Install the [Synthetic Monitoring plugin](https://grafana.com/grafana/plugins/grafana-synthetic-monitoring-app)

Navigate to the plugins page in your Grafana instance, and enable the plugin

Click on the Synthetic Monitoring plugin in the sidebar. Add an admin key from [grafana.com](https://grafana.com) into the input. The admin key is used to generate the required datasources, and then discarded. You can delete the admin key from grafana.com after setup is complete.

#### Via provisioning

Synthetic Monitoring can alternatively be installed via [plugin provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#plugins). Follow this provisioning template:

```yaml
apiVersion: 1

apps:
  - type: grafana-synthetic-monitoring-app
    name: grafana-synthetic-monitoring-app
    disabled: false
    jsonData:
      apiHost: https://synthetic-monitoring-api.grafana.net
      stackId: <instanceId of your hosted grafana>
      logs:
        grafanaName: <Name of a Loki datasource pointed to a Grafana Cloud Loki instance>
        hostedId: <Grafana Cloud Loki instance ID>
      metrics:
        grafanaName: <Name of a Prometheus datasource pointed to a Grafana Cloud Prometheus instance>
        hostedId: <Grafana Cloud Prometheus instance ID>
    secureJsonData:
      publisherToken: <A metric publisher token from grafana.com>
```

Prerequisites:

1. A datasource pointed at a Prometheus instance hosted in Grafana Cloud
2. A datasource pointed at a Loki instance hosted in Grafana Cloud

To start the using app:

1. Navigate to Synthetic Monitoring via the sidebar
2. Click the **Get Started** button. This will initialize the app.

During the Initialization process, the Synthetic Monitoring backend will:

1. Validate the Publisher API key provided in the provisioning file.
2. Ensure the account has active Grafana Cloud Prometheus and Grafana Cloud Loki services
3. The dashboards included with the App will then be imported.
4. Finally, the Synthentic Monitoring Backend will be notified that the service is ready.

Users can then create checks to monitor their remote targets.
