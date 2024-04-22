import React, { FC, useContext, useState } from 'react';
import { DataSourceInstanceSettings, DataSourceJsonData, GrafanaTheme2, OrgRole, PageLayoutType } from '@grafana/data';
import { config, getBackendSrv } from '@grafana/runtime';
import { Alert, Button, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { isNumber } from 'lodash';

import { ROUTES, SubmissionErrorWrapper } from 'types';
import { FaroEvent, reportError, reportEvent } from 'faro';
import { hasRole, initializeDatasource } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { LEGACY_LOGS_DS_NAME, LEGACY_METRICS_DS_NAME } from 'components/constants';
import { MismatchedDatasourceModal } from 'components/MismatchedDatasourceModal';
import { PluginPage } from 'components/PluginPage';
import { getRoute } from 'components/Routing';
import { WelcomeTabs } from 'components/WelcomeTabs/WelcomeTabs';

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

      await initializeDatasource(datasourcePayload);

      // force reload so that GrafanaBootConfig is updated.
      window.location.href = `${window.location.origin}${getRoute(ROUTES.Home)}`;
    } catch (e) {
      const err = e as unknown as SubmissionErrorWrapper;
      setError(err.data?.msg ?? err.data?.err ?? 'Something went wrong');
      setLoading(false);
      reportError(err.data?.msg ?? err.data?.err ?? err, FaroEvent.INIT);
    }
  };

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <div className={styles.container}>
        <div className={styles.header}>
          <img src={meta?.info.logos.large} className={styles.logo} />
          <h1 className={styles.title}>
            Proactively monitor your endpoints and user flows from locations around the world
          </h1>
          <div>
            <h5 className={styles.description}>
              Grafana Cloud Synthetic Monitoring is powered by k6, Mimir, and Loki. Measure performance and uptime,
              simulate user journeys, and get alerted before your users
            </h5>
          </div>
          <Button
            onClick={handleClick}
            disabled={loading || !hasRole(OrgRole.Editor)}
            size="lg"
            className={styles.getStartedButton}
          >
            {loading ? <Spinner /> : 'Get started'}
          </Button>
          {error && (
            <Alert title="Something went wrong:" className={styles.errorAlert}>
              {error}
            </Alert>
          )}
        </div>
        <hr className={styles.divider} />
        <div className={styles.valueProp}>
          <h3 className={styles.valuePropHeader}>Up and running in seconds, no instrumentation required</h3>
          <WelcomeTabs />
        </div>
      </div>

      <MismatchedDatasourceModal
        isOpen={datasourceModalOpen}
        metricsFoundName={metricsByName?.name ?? 'Not found'}
        metricsExpectedName={metricsByUid?.name ?? 'Not found'}
        logsFoundName={logsByName?.name ?? 'Not found'}
        logsExpectedName={logsByUid?.name ?? 'Not found'}
        onDismiss={() => setDataSouceModalOpen(false)}
        isSubmitting={loading}
        onSubmit={() => {
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
      />
    </PluginPage>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      width: '100%',
      height: '100%',
      marginTop: theme.spacing(16),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      textAlign: 'center',
    }),
    header: css({
      maxWidth: '520px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginBottom: theme.spacing(8),
    }),
    logo: css({
      width: '100px',
    }),
    title: css({
      paddingTop: theme.spacing(8),
      paddingBottom: theme.spacing(4),
    }),
    errorAlert: css({
      marginTop: theme.spacing(4),
    }),
    description: css({
      color: theme.colors.text.secondary,
    }),
    getStartedButton: css({
      marginTop: theme.spacing(8),
    }),
    divider: css({
      width: '100%',
    }),
    valueProp: css({
      marginTop: theme.spacing(6),
      maxWidth: '700px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }),
    valuePropHeader: css({ marginBottom: theme.spacing(4) }),
  };
}
