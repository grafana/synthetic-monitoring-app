import React, { FC, useState, useContext } from 'react';
import { Button, Alert, HorizontalGroup, useStyles2 } from '@grafana/ui';
import { getBackendSrv, config } from '@grafana/runtime';
import { hasRole, initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'contexts/InstanceContext';
import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { css, cx } from '@emotion/css';
import { colors, LEGACY_LOGS_DS_NAME, LEGACY_METRICS_DS_NAME } from 'components/constants';
import dashboardScreenshot from 'img/screenshot-dash-http.png';
import dashboardScreenshotLight from 'img/screenshot-dash-http-light.png';
import bell from 'img/bell.svg';
import bellLight from 'img/bell-light.svg';
import welcomeGraph from 'img/welcomegraph.svg';
import welcomeGraphLight from 'img/welcomegraph-light.svg';
import loki from 'img/loki.svg';
import checkInSquare from 'img/checkinsquare.svg';
import checkInSquareLight from 'img/checkinsquare-light.svg';
import whatYouCanDoBG from 'img/welcomepage-bg.svg';
import whatYouCanDoBGLight from 'img/welcomepage-bg-light.svg';
import dividingLine from 'img/dividingline.svg';
import { CloudDatasourceJsonData } from 'datasource/types';
import { isNumber } from 'lodash';
import { OrgRole } from 'types';
import { trackEvent, trackException } from 'analytics';

const getStyles = (theme: GrafanaTheme2) => {
  const textColor = theme.isDark ? colors.darkText : colors.lightText;
  return {
    container: css`
      position: absolute;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      background: ${theme.colors.background.canvas};
      color: ${textColor};
      z-index: 1;
      max-width: 1800px;
      min-width: 1200px;
      padding: 60px 120px 120px 120px;
    `,
    headerSection: css`
      display: flex;
      align-items: center;
      margin-bottom: ${theme.spacing(4)};
    `,
    headerTitle: css`
      color: ${textColor};
    `,
    headerLogo: css`
      height: 78px;
      width: 78px;
      margin-right: ${theme.spacing(3)};
    `,
    headerSubtext: css`
      margin-bottom: 0;
      line-height: 20px;
    `,
    mediumMarginBottom: css`
      margin-bottom: ${theme.spacing(4)};
    `,
    whatYouCanDoHeader: css`
      color: #ffffff;
      margin-bottom: ${theme.spacing(1)};
    `,
    whatYouCanDoContainer: css`
      margin-bottom: ${theme.spacing(3)};
      background-image: url(${theme.isDark ? whatYouCanDoBG : whatYouCanDoBGLight});
      background-repeat: no-repeat;
      background-position: left bottom;
      padding: ${theme.spacing(6)};
      box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.6);
      box-shadow: ${theme.isDark ? '0px 4px 10px 0px rgba(0, 0, 0, 0.6)' : '0px 4px 10px 0px rgba(195, 195, 195, 0.2)'};
    `,
    featuresContainer: css`
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      grid-auto-flow: row dense;
      grid-gap: ${theme.spacing(3)};
    `,
    cardGrid: css`
      display: grid;
      grid-template-columns: 1fr minmax(500px, 1fr);
      grid-template-rows: 240px 1fr;
      grid-template-areas:
        'billing screenshot'
        'start   screenshot';
      grid-gap: ${theme.spacing(4)};
    `,
    card: css`
      background-color: ${theme.colors.background.primary};
      border: 1px solid ${theme.isDark ? theme.colors.border.medium : theme.colors.border.weak};
      padding: ${theme.spacing(4)};
      box-shadow: ${theme.isDark ? '0px 4px 10px 0px rgba(0, 0, 0, 0.6)' : '0px 4px 10px 0px rgba(195, 195, 195, 0.2)'};
    `,
    billing: css`
      grid-area: 'billing';
    `,
    screenshotContainer: css`
      grid-area: 'screenshot';
    `,
    screenshotCard: css`
      padding: ${theme.spacing(2)};
    `,
    start: css`
      grid-area: 'start';
    `,
    heading: css`
      margin-bottom: ${theme.spacing(2)};
      color: ${theme.colors.text.maxContrast};
    `,
    divider: css`
      margin-right: ${theme.spacing(2)};
      /* margin-left: ${theme.spacing(1)}; */
    `,
    text: css`
      color: ${theme.colors.text.primary};
      min-width: 150px;
    `,
    screenshot: css`
      max-width: 100%;
    `,
    getStartedContainer: css`
      display: flex;
      justify-content: center;
    `,
    link: css`
      color: ${theme.colors.text.link};
    `,
    marginTop: css`
      margin-top: ${theme.spacing(3)};
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
  const [loading, setLoading] = useState(false);
  const { meta } = useContext(InstanceContext);
  const styles = useStyles2(getStyles);

  const metricsName = getMetricsName(meta?.jsonData?.metrics.grafanaName);
  const metricsDatasource = config.datasources[metricsName] as DataSourceInstanceSettings<CloudDatasourceJsonData>;
  const logsName = getLogsName(meta?.jsonData?.logs.grafanaName);
  const logsDatasource = config.datasources[logsName] as DataSourceInstanceSettings<CloudDatasourceJsonData>;
  const stackId = meta?.jsonData?.stackId;
  const onClick = async () => {
    trackEvent('provisionedSetupSubmit');
    if (!meta?.jsonData) {
      setError('Invalid plugin configuration');
      trackException('provisionedSetupSubmitError: Invalid plugin configuration');
      return;
    }
    setLoading(true);
    const body = {
      stackId: isNumber(stackId) ? stackId : parseInt(stackId ?? '1', 10),
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
      setError(e.data?.msg ?? e.data?.err);
      setLoading(false);
      trackException(`provisionedSetupSubmitError: ${e.data?.msg ?? e.data?.err}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <img src={meta?.info.logos.small} className={styles.headerLogo} />
        <div>
          <h2 className={styles.headerTitle}>Welcome to Grafana Cloud Synthetic Monitoring</h2>
          <p className={styles.headerSubtext}>
            Synthetic monitoring provides you with insights into how your applications and services are behaving from an
            external point of view. We provide 21 probe locations from around the world which assess availability,
            performance, and correctness of your services.
          </p>
        </div>
      </div>
      <div className={styles.whatYouCanDoContainer}>
        <h2 className={cx(styles.heading, styles.whatYouCanDoHeader)}>What you can do</h2>
        <div className={styles.mediumMarginBottom}>
          <a
            href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Read more in Synthetic Monitoring docs &gt;
          </a>
        </div>
        {/* <HorizontalGroup spacing="md"> */}
        <div className={styles.featuresContainer}>
          <HorizontalGroup spacing="lg" align="center">
            <img src={config.theme2.isDark ? checkInSquare : checkInSquareLight} />
            <span className={styles.text}>
              Create checks to monitor your services from Grafana hosted or private probes
            </span>
            <img src={dividingLine} className={styles.divider} />
          </HorizontalGroup>
          <HorizontalGroup spacing="lg" align="center">
            <img src={config.theme2.isDark ? welcomeGraph : welcomeGraphLight} />
            <span className={styles.text}>Visualize and query metrics and logs using pre-built dashboards</span>
            <img src={dividingLine} className={styles.divider} />
          </HorizontalGroup>
          <HorizontalGroup spacing="lg" align="center">
            <img src={loki} />
            <span className={styles.text}>Troubleshoot issues using log exploration</span>
            <img src={dividingLine} className={styles.divider} />
          </HorizontalGroup>
          <HorizontalGroup spacing="lg" align="center">
            <img src={config.theme2.isDark ? bell : bellLight} />
            <span className={styles.text}>
              Activate pre-built Prometheus style alerts right from the synthetic monitoring UI
            </span>
          </HorizontalGroup>
        </div>
        {/* </HorizontalGroup> */}
      </div>
      <div className={styles.cardGrid}>
        <div className={cx(styles.card, styles.billing)}>
          <h3 className={styles.heading}>How billing works</h3>
          <p>
            Synthetic monitoring is available to all hosted Grafana Cloud customers, no matter which plan you have.{' '}
          </p>
          <p>We bill you based on the metrics and logs that are published to your Grafana Cloud stack.</p>
          <a
            href="https://grafana.com/docs/grafana-cloud/synthetic-monitoring/synthetic-monitoring-billing/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Read more about billing &gt;
          </a>
        </div>
        <div className={styles.screenshotContainer}>
          <div className={cx(styles.card, styles.screenshotCard)}>
            <img
              src={config.theme2.isDark ? dashboardScreenshot : dashboardScreenshotLight}
              className={styles.screenshot}
            />
          </div>
        </div>
        <div className={cx(styles.card, styles.start)}>
          <h3 className={styles.heading}>Ready to start using synthetic monitoring?</h3>
          <Button
            onClick={onClick}
            disabled={loading || !Boolean(metricsDatasource) || !Boolean(logsDatasource) || !hasRole(OrgRole.EDITOR)}
            size="lg"
          >
            Initialize the plugin
          </Button>
        </div>
      </div>
      {error && (
        <div className={styles.marginTop}>
          <Alert title="Something went wrong:">{error}</Alert>
        </div>
      )}
    </div>
  );
};
