# Alerting on [Synthetic Monitoring](https://grafana.com/grafana/plugins/grafana-synthetic-monitoring-app)

Synthetic Monitoring data is written to your Grafana Cloud account and alerts can be created using either standard [Grafana alerts](https://grafana.com/docs/grafana/latest/alerting/create-alerts/) or with your [Prometheus Alertmanager instance](https://grafana.com/docs/grafana-cloud/metrics/prometheus/alerts_rules/).

In this example, we will be creating Alertmanager alerts on HTTP check data.

## Set up Synthetic Monitoring and create an HTTP check
[Install and configure](https://grafana.com/docs/grafana-cloud/synthetic-monitoring/installation/) Synthetic Monitoring in your Grafana Cloud account.


Save the Grafana Cloud API key created during installation. We will use this key to also create an alert.


Create at least one HTTP check:


1. Navigate to **Synthetic Monitoring > Checks**.
2. Click **New Check**.
3. Choose a **Check Type** of **HTTP**.
4. Enter a name.
5. Enter the target URL to be checked, ie. `https://grafana.com`.
6. Choose the probe locations to check from.
7. Click **Save**.


Checks push data to the Prometheus instance selected during installation that we will use to alert on. 


![Example HTTP Check](./sm_http_check.png)


## Export environment variables


We export a few pieces of information to create alerts. You should already have an [API key](https://grafana.com/profile/api-keys) with the `Admin` role from installing Synthetic Monitoring.


From your Grafana Cloud account, click **Details** on your **Alerts** instance and save the **URL** and **User** values for **Metrics Authentication Settings** and **Alertmanager Authentication Settings**.


![Alertmanager Details](./alertmanager_details.png)

Now export the following values to use for commands in the next steps.
```bash
export API_KEY=<API KEY>
# Alertmanager Authentication Settings
export ALERT_URL=<ALERT_URL>
export ALERT_USER=<ALERT_USER ID>
# Metrics Authentication Settings
export PROM_URL=<PROM_URL>
export PROM_USER=<PROM_USER ID>
```

## Install cortextool
See [Alerts - Grafana Cloud Docs](https://grafana.com/docs/grafana-cloud/metrics/prometheus/alerts_rules/) 
for instructions on how to install [cortextool](https://github.com/grafana/cortex-tools/releases).

Once installed, try `cortextool --help` to verify it is working.


## Configure Alertmanager
Alertmanager needs to be configured if you have not already done so.

**Load your config**

1. See [Prometheus Docs](https://grafana.com/docs/grafana-cloud/metrics/prometheus/alerts_rules/#upload-alertmanager-configuration-to-your-grafana-cloud-alerts-instance).
2. Create an `alertmanager.yml` based on the docs sample and information, see [example alertmanager config file](./alertmanager.yml) for reference.

`cortextool alertmanager load alertmanager.yml --address=${ALERT_URL} --id=${ALERT_USER} --key=${API_KEY}`


**Verify your config**

`cortextool alertmanager get  --address=${ALERT_URL} --id=${ALERT_USER} --key=${API_KEY}`

Visit `<alertmanager-address>/alertmanager` to check your config.

> TIP: See the Grafana blog post: [*Step-by-step guide to setting up Prometheus Alertmanager with Slack, PagerDuty, and Gmail*](https://grafana.com/blog/2020/02/25/step-by-step-guide-to-setting-up-prometheus-alertmanager-with-slack-pagerduty-and-gmail/).




## Create and upload alert rules

Here we will alert when our website takes more than `0.5 seconds` to load on the Bangalore probe. 
This is what the Prometheus query looks like. Play around and use Grafana Explore mode to test your queries and figure out thresholds.

```
probe_duration_seconds{job="website", probe="Bangalore"} > 0.50
```


The rules file for the alert may look something like:
```yaml
# prom_rules.yml
namespace: 'prom_rules'
groups:
  - name: 'probe_duration_rules_and_alerts'
    rules:
      - alert: 'ProbeDurationHalfSecondExceeded'
        annotations:
          message: "Check {{ $labels.job }} is taking more than 0.5 seconds."
        expr: "probe_duration_seconds{job="website", probe="Bangalore"} > 0.50"
        for: "1m"
        labels:
          "severity": "critical"
```

See the [Grafana Cloud Alerting docs](https://grafana.com/docs/grafana-cloud/metrics/prometheus/alerts_rules/#upload-recording-and-alerting-rules-definition-to-your-grafana-cloud-metrics-instance), and [example rules file](./prom_rules.yml) for more information.

**Load rules**

`cortextool rules load prom_rules.yml --address=${PROM_URL} --id=${PROM_USER} --key=${API_KEY}`

**List rules**

`cortextool rules list --address=${PROM_URL} --id=${PROM_USER} --key=${API_KEY}`

**See rules**

`cortextool rules print --address=${PROM_URL} --id=${PROM_USER} --key=${API_KEY}`

**Delete rules**

`cortextool rules delete <namespace> <rule group> --address=${PROM_URL} --id=${PROM_USER} --key=${API_KEY}`

You can visit `<alertmanager-address>/alertmanager/#/alerts` to see your active alerts


## Update alert rules
Alert Rules can be updated by changing the `prom_rules.yml` file and loading the rules again.

**Update alerts**

`cortextool rules load prom_rules.yml --address=${PROM_URL} --id=${PROM_USER} --key=${API_KEY}`

**See updated alerts**

`cortextool rules print --address=${PROM_URL} --id=${PROM_USER} --key=${API_KEY}`

## Test Alerts
Set low thresholds to test the alert, and verify that notifications are delivered.

An alert email may look something like:
![Alert Email](./alert_email.png)

**Tips:**
- Use Grafana explore mode to see data about how many alerts are firing.
    - `ALERTS{alertstate="firing"}` will print all firing alerts
- Use this [Grafana Dashboard](https://grafana.com/grafana/dashboards/11098) to see, and debug your Prometheus Alerts in Grafana
