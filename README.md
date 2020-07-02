Synthetic monitoring application
================================

Synthetic Monitoring is a blackbox monitoring solution provided as part of [Grafana Cloud](https://grafana.com/products/cloud/).
Synthetic Monitoring provides users with insights into how their applications and services are behaving from an external point of view.
Users can define checks to continually test remote targets from 1 or more probe locations around the world to assess the availability, performance and correctness of the services.  As each check runs, metrics and logs are collected and published to the user's Grafana Cloud service.  Metrics are published to Grafana Cloud Prometheus and logs are published to Grafana Cloud Loki.

Synthetic monitoring is the successor to the original [worldping application](https://grafana.net/plugins/raintank-worldping-app).
The refreshed Synthetic Monitoring product focuses on reducing complexity and taking advantage of Grafana Cloud capabilities.

### Check Types
Users can define HTTP/HTTPS, DNS, TCP and ICMP Ping checks to monitor their remote targets. Internally, the Synthetic Monitoring solution uses the [Prometheus Blackbox exporter](https://github.com/prometheus/blackbox_exporter) for executing the checks and collecting metrics and logs.  When creating a check, users are able to customize the settings and validation rules supported by the Blackbox exporter.

### Probe Locations
For each check, users can select 1 or more 'public' probe locations distributed throughout the world to run tests from.  Additionally, users can run their own 'private' probe locations by downloading and deploying the [Synthetic Monitoring Agent](https://github.com/grafana/synthetic-monitoring-agent).

### Configuration

Once the app has been [installed](https://grafana.com/grafana/plugins/grafana-synthetic-monitoring-app/installation) into your Grafana instance, it needs to be enabled and initialized.

To enable the app:
1. Navigate to __Configuration__ > __Plugins__ within your Grafana instance, then select the "Synthetic Monitoring" app from the list.
2. Click the __Enable__ button on the plugin page to enable the plugin and start the initialization process.

During initialization, you will be asked to enter a Admin API key for your Grafana.com account.  This key is only needed for the initialization process and will not be stored.  A new key can be generated within the [grafana.com portal](http://grafana.com/profile/api-keys).

During the Initialization process, the Synthetic Monitoring backend will:
1. Validate the Admin API key.
2. Ensure the account has active Grafana Cloud Prometheus and Grafana Cloud Loki services
3. Create __Publisher__ API keys which will be used to allow collected metrics and logs to be published to the selected Grafana Cloud Prometheus and Loki instances.
4. The App will then prompt the user to select the Grafana Cloud Prometheus and Loki instances that should be used for storing the data collected by the Synthetic Monitoring platform.
5. If the Grafana instance does not already have data sources configured for these Grafana Cloud instances, the app will create them.  During this step, the app automatically creates __Viewer__ API keys within grafana.com to be used by the data sources.
6. The dashboards included with the App will then be imported.
7. Finally, the Synthentic Monitoring Backend will be notified that the service is ready.

Users can then create checks to monitor their remote targets.

