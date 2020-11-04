import React, { FC, useState, useContext } from 'react';
import { Button, Alert, useStyles, HorizontalGroup, useTheme } from '@grafana/ui';
import { getBackendSrv, config } from '@grafana/runtime';
import { initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'components/InstanceContext';
import { DataSourceInstanceSettings, GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';
import { colors, LEGACY_LOGS_DS_NAME, LEGACY_METRICS_DS_NAME } from 'components/constants';
import dashboardScreenshot from 'img/screenshot-dash-http.png';
import dashboardScreenshotLight from 'img/screenshot-dash-http-light.png';
import darkCircledCheck from 'img/dark-circled-check.svg';
import darkCircledGraph from 'img/dark-circled-graph.svg';
import darkCircledAlert from 'img/dark-circled-alert.svg';
import darkCircledSM from 'img/dark-circled-sm.svg';
import lightCircledCheck from 'img/light-circled-check.svg';
import lightCircledGraph from 'img/light-circled-graph.svg';
import lightCircledAlert from 'img/light-circled-alert.svg';
import lightCircledSM from 'img/light-circled-sm.svg';
import circledLoki from 'img/circled-loki.svg';
import { CloudDatasourceJsonData } from 'datasource/types';

const getStyles = (theme: GrafanaTheme) => {
  const textColor = theme.isDark ? colors.darkText : colors.lightText;
  return {
    bannerContainer: css`
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      background: ${theme.isDark ? colors.darkThemeBlueBackground : colors.lightThemeBlueBackground};
      color: ${textColor};
    `,
    bannerBackground: css`
      background-image: url(${theme.isDark ? darkCircledSM : lightCircledSM});
      background-repeat: no-repeat;
      background-position: top 20px right;
      display: flex;
      justify-content: center;
    `,
    banner: css`
      max-width: 1500px;
      padding: 60px 120px 120px 120px;
    `,
    headerSection: css`
      display: flex;
      align-items: center;
      margin-bottom: ${theme.spacing.xl};
    `,
    headerTitle: css`
      color: ${textColor};
    `,
    headerLogo: css`
      height: 78px;
      width: 78px;
      margin-right: ${theme.spacing.lg};
    `,
    headerSubtext: css`
      margin-bottom: 0;
      line-height: 20px;
    `,
    subheaderSection: css`
      display: grid;
      grid-template-columns: 50% 50%;
      margin-bottom: ${theme.spacing.xl};
    `,
    subheaderTextContainer: css`
      padding: 0 ${theme.spacing.xl};
      p {
        margin-bottom: 0;
      }
    `,
    subheaderTitle: css`
      margin-bottom: ${theme.spacing.md};
      color: ${textColor};
    `,
    subheaderContent: css`
      display: grid;
      grid-template-columns: 50% 50%;
      grid-gap: ${theme.spacing.xl};
      margin-bottom: ${theme.spacing.xl};
    `,
    screenshot: css`
      max-width: 100%;
    `,
    getStartedContainer: css`
      display: flex;
      justify-content: center;
    `,
    link: css`
      text-decoration: underline;
    `,
  };
};

function getMetricsName(provisionedName?: string) {
  if (config.datasources[LEGACY_METRICS_DS_NAME]) {
    return LEGACY_METRICS_DS_NAME;
  }
  return provisionedName ?? '';
}

function getLogsName(provisionedName?: string) {
  if (config.datasources[LEGACY_LOGS_DS_NAME]) {
    return LEGACY_LOGS_DS_NAME;
  }
  return provisionedName ?? '';
}

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const [error, setError] = useState('');
  const { meta } = useContext(InstanceContext);
  const theme = useTheme();
  const styles = useStyles(getStyles);

  const metricsName = getMetricsName(meta?.jsonData?.metrics.grafanaName);
  const metricsDatasource = config.datasources[metricsName] as DataSourceInstanceSettings<CloudDatasourceJsonData>;
  const logsName = getLogsName(meta?.jsonData?.logs.grafanaName);
  const logsDatasource = config.datasources[logsName] as DataSourceInstanceSettings<CloudDatasourceJsonData>;
  const onClick = async () => {
    if (!meta?.jsonData) {
      setError('Invalid plugin configuration');
      return;
    }
    const body = {
      stackId: parseInt(meta.jsonData.grafanaInstanceId ?? '1', 10),
      metricsInstanceId: meta.jsonData.metrics?.hostedId,
      logsInstanceId: meta.jsonData.logs?.hostedId,
    };
    try {
      const { accessToken } = await getBackendSrv().request({
        url: `api/plugin-proxy/${meta.id}/install`,
        method: 'POST',
        data: body,
      });
      const dashboards = await importAllDashboards(metricsName, logsName);
      const datasourcePayload = {
        apiHost: meta.jsonData.apiHost,
        accessToken,
        metrics: meta.jsonData.metrics,
        logs: meta.jsonData.logs,
      };

      await initializeDatasource(datasourcePayload, dashboards);

      // force reload so that GrafanaBootConfig is updated.
      window.location.reload();
    } catch (e) {
      setError(e.data?.msg);
    }
  };

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerBackground}>
        <div className={styles.banner}>
          <div className={styles.headerSection}>
            <img src={meta?.info.logos.small} className={styles.headerLogo} />
            <div>
              <h2 className={styles.headerTitle}>Welcome to Grafana Cloud Synthetic Monitoring</h2>
              <p className={styles.headerSubtext}>
                Synthetic Monitoring provides you with insights into how your applications and services are behaving
                from an external point of view. We provide 21 probe locations from around the world which assess
                availability, performance, and correctness of your services.{' '}
                <a className={styles.link} href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/">
                  Read more in Synthetic Monitoring docs &gt;
                </a>
              </p>
            </div>
          </div>
          <div className={styles.subheaderSection}>
            <img src={theme.isDark ? dashboardScreenshot : dashboardScreenshotLight} className={styles.screenshot} />
            <div className={styles.subheaderTextContainer}>
              <h3 className={styles.subheaderTitle}>What you can do</h3>
              <div className={styles.subheaderContent}>
                <HorizontalGroup align="flex-start">
                  <img src={theme.isDark ? darkCircledCheck : lightCircledCheck} />
                  <p>Create checks to monitor your services from Grafana hosted or private probes</p>
                </HorizontalGroup>
                <HorizontalGroup align="flex-start">
                  <img src={circledLoki} />
                  <p>Troubleshoot issues using log exploration</p>
                </HorizontalGroup>
                <HorizontalGroup align="flex-start">
                  <img src={theme.isDark ? darkCircledGraph : lightCircledGraph} />
                  <p>Visualize and query metrics and logs using pre-built dashboards</p>
                </HorizontalGroup>
                <HorizontalGroup align="flex-start">
                  <img src={theme.isDark ? darkCircledAlert : lightCircledAlert} />
                  <p>Set up Prometheus style alerts</p>
                </HorizontalGroup>
              </div>
              <div>
                Synthetic Monitoring is available to hosted Grafana Cloud customers. We bill you based on the metrics
                and logs that are published to your Grafana Cloud stack.
              </div>
            </div>
          </div>
          <Button onClick={onClick} disabled={!Boolean(metricsDatasource) || !Boolean(logsDatasource)}>
            Monitor your systems
          </Button>
          {error && <Alert title="Something went wrong:">{error}</Alert>}
        </div>
      </div>
    </div>
  );
};
