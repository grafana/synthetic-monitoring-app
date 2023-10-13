import React, { FC, useState, useContext } from 'react';
import { Button, Alert, useStyles2, Spinner, Modal } from '@grafana/ui';
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
import { DisplayCard } from 'components/DisplayCard';
import FeaturesBanner from 'components/FeaturesBanner';
import { PluginPage } from 'components/PluginPage';
import { FaroEvent, reportEvent, reportError } from 'faro';

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
    datasourceSelectionGrid: css`
      display: grid;
      grid-template-columns: 1fr 1fr;
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

function findDatasourceByNameAndUid(
  provisionedName: string,
  type: 'loki' | 'prometheus'
): {
  byName: DataSourceInstanceSettings<DataSourceJsonData> | undefined;
  byUid: DataSourceInstanceSettings<DataSourceJsonData> | undefined;
} {
  const byName = config.datasources[provisionedName];
  const byUid = Object.values(config.datasources).find((ds) => {
    if (type === 'loki') {
      return ds.uid === 'grafanacloud-logs';
    } else {
      return ds.uid === 'grafanacloud-metrics';
    }
  });
  return {
    byName,
    byUid,
  };
}

enum DatasourceStatus {
  NameOnly = 'NameOnly',
  Match = 'Match',
  Mismatch = 'Mismatch',
  UidOnly = 'UidOnly',
  NotFound = 'NotFound',
}

function ensureNameAndUidMatch(
  metricsByName?: DataSourceInstanceSettings<DataSourceJsonData>,
  metricsByUid?: DataSourceInstanceSettings<DataSourceJsonData>
): DatasourceStatus {
  if (!metricsByUid && !metricsByName) {
    return DatasourceStatus.NotFound;
  }
  if (!metricsByUid && metricsByName) {
    return DatasourceStatus.NameOnly;
  }
  if (metricsByUid && !metricsByName) {
    return DatasourceStatus.UidOnly;
  }
  if (metricsByUid && metricsByName) {
    if (metricsByUid.name === metricsByName.name) {
      return DatasourceStatus.Match;
    }
    return DatasourceStatus.Mismatch;
  }
  throw new Error('Invalid provisioning. Could not find datasources');
}

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [datasourceModalOpen, setDataSouceModalOpen] = useState(false);
  const { meta } = useContext(InstanceContext);
  const styles = useStyles2(getStyles);

  const metricsName = getMetricsName(meta?.jsonData?.metrics.grafanaName);
  const { byName: metricsByName, byUid: metricsByUid } = findDatasourceByNameAndUid(metricsName, 'prometheus');
  const logsName = getLogsName(meta?.jsonData?.logs.grafanaName);
  const { byName: logsByName, byUid: logsByUid } = findDatasourceByNameAndUid(logsName, 'loki');
  const stackId = meta?.jsonData?.stackId;

  const handleClick = async () => {
    try {
      const metricsStatus = ensureNameAndUidMatch(metricsByName, metricsByUid);
      const logsStatus = ensureNameAndUidMatch(logsByName, logsByUid);

      if (metricsStatus === DatasourceStatus.NotFound) {
        throw new Error('Invalid plugin configuration. Could not find a metrics datasource');
      }
      if (logsStatus === DatasourceStatus.NotFound) {
        throw new Error('Invalid plugin configuration. Could not find a logs datasource');
      }
      // Either the plugin is running on prem and can find a datasource, or the provisioning matches with the default grafana cloud UIDs. Everything is good to go!
      if (
        (metricsStatus === DatasourceStatus.Match || metricsStatus === DatasourceStatus.NameOnly) &&
        metricsByName &&
        (logsStatus === DatasourceStatus.Match || logsStatus === DatasourceStatus.NameOnly) &&
        logsByName
      ) {
        const metricsHostedId = meta?.jsonData?.metrics.hostedId;
        if (!metricsHostedId) {
          throw new Error('Invalid plugin configuration. Could not find metrics datasource hostedId');
        }

        const logsHostedId = meta?.jsonData?.logs.hostedId;
        if (!logsHostedId) {
          throw new Error('Invalid plugin configuration. Could not find logs datasource hostedId');
        }

        initialize({
          metricsSettings: metricsByName,
          metricsHostedId,
          logsSettings: logsByName,
          logsHostedId: logsHostedId,
        });
        return;
      }

      if (metricsStatus === DatasourceStatus.UidOnly || logsStatus === DatasourceStatus.UidOnly) {
        setDataSouceModalOpen(true);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Invalid plugin configuration. Could not find logs and metrics datasources');
    }
  };

  const initialize = async ({
    metricsSettings,
    metricsHostedId,
    logsSettings,
    logsHostedId,
  }: {
    metricsSettings: DataSourceInstanceSettings<DataSourceJsonData>;
    metricsHostedId: number;
    logsSettings: DataSourceInstanceSettings<DataSourceJsonData>;
    logsHostedId: number;
  }) => {
    reportEvent(FaroEvent.INIT);
    if (!meta?.jsonData) {
      reportError('Invalid plugin configuration', FaroEvent.INIT);
      setError('Invalid plugin configuration');
      return;
    }
    setLoading(true);
    const body = {
      stackId: isNumber(stackId) ? stackId : parseInt(stackId ?? '1', 10),
      metricsInstanceId: metricsHostedId,
      logsInstanceId: logsHostedId,
    };
    try {
      const { accessToken } = await getBackendSrv().request({
        url: `api/plugin-proxy/${meta.id}/install`,
        method: 'POST',
        data: body,
      });
      const smDatasources = await findSMDataSources();
      const smDatasourceName = smDatasources.length ? smDatasources[0].name : 'Synthetic Monitoring';
      const dashboards = await importAllDashboards(metricsSettings.uid, logsSettings.uid, smDatasourceName);
      const datasourcePayload = {
        apiHost: meta.jsonData.apiHost,
        accessToken,
        metrics: {
          uid: metricsSettings.uid,
          grafanaName: metricsSettings.name,
          type: metricsSettings.type,
          hostedId: meta.jsonData.metrics?.hostedId,
        },
        logs: {
          uid: logsSettings.uid,
          grafanaName: logsSettings.name,
          type: logsSettings.type,
          hostedId: meta.jsonData.logs?.hostedId,
        },
      };

      await initializeDatasource(datasourcePayload, dashboards);

      // force reload so that GrafanaBootConfig is updated.
      window.location.reload();
    } catch (e) {
      const err = e as unknown as SubmissionErrorWrapper;
      setError(err.data?.msg ?? err.data?.err ?? 'Something went wrong');
      setLoading(false);
      reportError(err.data?.msg ?? err.data?.err ?? err, FaroEvent.INIT);
    }
  };

  return (
    <PluginPage pageNav={{ text: 'Welcome' }}>
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
              <Button onClick={handleClick} disabled={loading || !hasRole(OrgRole.Editor)} size="lg">
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
      <Modal isOpen={datasourceModalOpen} title="Datasource selection">
        <p>
          It looks like there is a mismatch between the way Synthetic Monitoring was provisioned and the currently
          available datasources. This can happen when a Grafana instance is renamed, or if provisioning is incorrect.
          Proceed with found datasources?
        </p>
        <div className={styles.datasourceSelectionGrid}>
          <dt>Expecting metrics datasource:</dt>
          <dt>Found metrics datasource:</dt>
          <dd>{metricsName}</dd>
          <dd>{metricsByUid?.name}</dd>
          <dt>Expecting logs datasource:</dt>
          <dt>Found logs datasource:</dt>
          <dd>{logsName}</dd>
          <dd>{logsByUid?.name}</dd>
        </div>
        <Modal.ButtonRow>
          <Button variant="secondary" fill="outline" onClick={() => setDataSouceModalOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={loading}
            onClick={() => {
              if (meta?.jsonData?.metrics?.hostedId && meta?.jsonData?.logs.hostedId) {
                initialize({
                  metricsSettings: metricsByUid!, // we have already guaranteed that this exists above
                  metricsHostedId: meta.jsonData.metrics.hostedId,
                  logsSettings: logsByUid!, // we have already guaranteed that this exists above
                  logsHostedId: meta.jsonData.logs.hostedId,
                });
              } else {
                setError('Missing datasource hostedId');
              }
            }}
          >
            {loading ? <Spinner /> : 'Proceed'}
          </Button>
        </Modal.ButtonRow>
      </Modal>
    </PluginPage>
  );
};
