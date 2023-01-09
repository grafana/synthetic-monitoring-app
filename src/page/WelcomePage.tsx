import React, { FC, useState, useContext } from 'react';
import { Button, Alert, useStyles2, Spinner } from '@grafana/ui';
import { getBackendSrv, config } from '@grafana/runtime';
import { findSMDataSources, hasRole, initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'contexts/InstanceContext';
import { DataSourceInstanceSettings, GrafanaTheme2, OrgRole, DataSourceJsonData } from '@grafana/data';
import { css } from '@emotion/css';
import { colors, LEGACY_LOGS_DS_NAME, LEGACY_METRICS_DS_NAME } from 'components/constants';
import { dashboardScreenshot, dashboardScreenshotLight } from 'img';
import { isNumber } from 'lodash';
import { SubmissionErrorWrapper } from 'types';
import { trackEvent, trackException } from 'analytics';
import { DisplayCard } from 'components/DisplayCard';
import FeaturesBanner from 'components/FeaturesBanner';
import { PluginPage } from 'components/PluginPage';

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
      min-width: 1200px;
      padding: 60px 120px 120px 120px;
      display: flex;
      justify-content: center;
    `,
    maxWidth: css`
      max-width: 1800px;
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
    cardGrid: css`
      display: grid;
      grid-template-columns: 1fr minmax(500px, 1fr);
      grid-template-rows: 240px 1fr;
      grid-template-areas:
        'billing screenshot'
        'start   screenshot';
      grid-gap: ${theme.spacing(4)};
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
  const metricsDatasource = config.datasources[metricsName] as DataSourceInstanceSettings<DataSourceJsonData>;
  const logsName = getLogsName(meta?.jsonData?.logs.grafanaName);
  const logsDatasource = config.datasources[logsName] as DataSourceInstanceSettings<DataSourceJsonData>;
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
      const smDatasources = await findSMDataSources();
      const smDatasourceName = smDatasources.length ? smDatasources[0].name : 'Synthetic Monitoring';
      const dashboards = await importAllDashboards(metricsName, logsName, smDatasourceName);
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
      const err = e as unknown as SubmissionErrorWrapper;
      setError(err.data?.msg ?? err.data?.err ?? 'Something went wrong');
      setLoading(false);
      trackException(`provisionedSetupSubmitError: ${err.data?.msg ?? err.data?.err}`);
    }
  };

  return (
    <PluginPage pageNav={{ text: 'Welcome', description: 'Welcome to synthetic monitoring' }}>
      <div className={styles.container}>
        <div className={styles.maxWidth}>
          <div className={styles.headerSection}>
            <img src={meta?.info.logos.small} className={styles.headerLogo} />
            <div>
              <h2 className={styles.headerTitle}>Welcome to Grafana Cloud Synthetic Monitoring</h2>
              <p className={styles.headerSubtext}>
                Synthetic monitoring provides you with insights into how your applications and services are behaving
                from an external point of view. We provide 21 probe locations from around the world which assess
                availability, performance, and correctness of your services.
              </p>
            </div>
          </div>
          <FeaturesBanner />
          <div className={styles.cardGrid}>
            <DisplayCard className={styles.billing}>
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
            </DisplayCard>
            <div className={styles.screenshotContainer}>
              <DisplayCard className={styles.screenshotCard}>
                <img
                  src={config.theme2.isDark ? dashboardScreenshot : dashboardScreenshotLight}
                  className={styles.screenshot}
                />
              </DisplayCard>
            </div>
            <DisplayCard className={styles.start}>
              <h3 className={styles.heading}>Ready to start using synthetic monitoring?</h3>
              <Button
                onClick={onClick}
                disabled={
                  loading || !Boolean(metricsDatasource) || !Boolean(logsDatasource) || !hasRole(OrgRole.Editor)
                }
                size="lg"
              >
                {loading ? <Spinner /> : 'Initialize the plugin'}
              </Button>
            </DisplayCard>
          </div>
          {error && (
            <div className={styles.marginTop}>
              <Alert title="Something went wrong:">{error}</Alert>
            </div>
          )}
        </div>
      </div>
    </PluginPage>
  );
};
