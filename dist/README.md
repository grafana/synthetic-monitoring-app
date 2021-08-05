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

Synthetic Monitoring requires a Grafana Cloud account, and is installed by default in Grafana Cloud stacks. A local Grafana instance can be configured to connect to Synthetic Monitoring via a [provisioning file](https://grafana.com/docs/grafana/latest/administration/provisioning/#plugins):

```yaml
apiVersion: 1

apps:
  - type: grafana-synthetic-monitoring-app
    name: grafana-synthetic-monitoring-app
    disabled: false
    jsonData:
      apiHost: https://synthetic-monitoring-api.grafana.net
      stackId: <instance ID of your hosted grafana>
      logs:
        grafanaName: <name of an existing Loki datasource pointing to the Grafana Cloud Loki instance>
        hostedId: <Grafana Cloud Loki instance ID>
      metrics:
        grafanaName: <name of an existing Prometheus datasource pointing to the Grafana Cloud Prometheus instance>
        hostedId: <Grafana Cloud Prometheus instance ID>
    secureJsonData:
      publisherToken: <metric publisher token from grafana.com>
```

Note: you can add a provisioning block per [org](https://grafana.com/docs/grafana/latest/manage-users/server-admin/server-admin-manage-orgs/) to provision the plugin for multiple orgs. You can provide different values for each org block and connect to a different cloud stack per org.

The names of the datasources specified in the provisioning file _must_ match the names of existing datasources in Grafana. If you are also provisioning the datasources using the procedure below, make sure the datasource names match.

Prerequisites:

1. A datasource pointed at a Prometheus instance hosted in Grafana Cloud
2. A datasource pointed at a Loki instance hosted in Grafana Cloud

**Note: The Prometheus and Loki instances must be part of the same Cloud stack**

The required datasources can be [added via provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#data-sources). The information needed can be copied from Prometheus and Loki datasources found in the datasources tab of a Cloud hosted Grafana instance:

```yaml
apiVersion: 1

datasources:
  - name: <datasource name>
    type: loki
    access: proxy
    url: https://logs-prod-us-central1.grafana.net
    basicAuth: true
    basicAuthUser: <Grafana Cloud Loki instance ID>
    jsonData:
      maxLines: 1000
    secureJsonData:
      basicAuthPassword: <viewer token from grafana.com>
    version: 1

  - name: <datasource name>
    type: prometheus
    access: proxy
    url: https://prometheus-us-central1.grafana.net/api/prom
    basicAuth: true
    basicAuthUser: <Grafana Cloud Prometheus instance ID>
    jsonData:
      timeInterval: 1s
    secureJsonData:
      basicAuthPassword: <viewer token from grafana.com>
    version: 1
```

To start the using app:

1. Navigate to Synthetic Monitoring via the sidebar
2. Click the **Get Started** button. This will initialize the app.

During the Initialization process, the Synthetic Monitoring backend will:

1. Validate the Publisher API key provided in the provisioning file.
2. Ensure the account has active Grafana Cloud Prometheus and Grafana Cloud Loki services
3. The dashboards included with the App will then be imported.
4. Finally, the Synthentic Monitoring Backend will be notified that the service is ready.

Users can then create checks to monitor their remote targets. Metrics and logs will flow into the selected Cloud stack.
