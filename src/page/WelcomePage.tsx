import React, { FC, useState } from 'react';
import { Button, Alert } from '@grafana/ui';
import { config, getBackendSrv, getLocationSrv } from '@grafana/runtime';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';
import { initializeDatasource } from 'utils';
import { dashboardPaths, importAllDashboards, importDashboard } from 'dashboards/loader';
import { DashboardInfo } from 'datasource/types';

interface Props {
  meta: AppPluginMeta<GlobalSettings>;
}

export const WelcomePage: FC<Props> = ({ meta }) => {
  const [error, setError] = useState();

  const onClick = async () => {
    const body = {
      stackId: parseInt(meta.jsonData?.grafanaInstanceId, 10),
      metricsInstanceId: meta.jsonData?.metrics?.hostedId,
      logsInstanceId: meta.jsonData?.logs?.hostedId,
    };
    try {
      const { accessToken } = await getBackendSrv().request({
        url: `api/plugin-proxy/${meta.id}/register`,
        method: 'POST',
        data: body,
      });
      const dashboards = await importAllDashboards(
        meta.jsonData?.metrics?.grafanaName,
        meta.jsonData?.logs.grafanaName
      );
      const datasourcePayload = {
        apiHost: meta.jsonData?.apiHost,
        accessToken,
        metrics: meta.jsonData?.metrics,
        logs: meta.jsonData?.logs,
      };
      console.log({ accessToken, dashboards, datasourcePayload });
      await initializeDatasource(datasourcePayload, dashboards);
      getLocationSrv().update({
        partial: false,
        query: { page: 'checks' },
      });
      window.location.reload();
    } catch (e) {
      console.log('hiiii', e);
      setError(e.data?.msg);
    }
  };

  return (
    <div>
      <h1>Welcome to Synthetic Monitoring</h1>
      <Button onClick={onClick}>Start</Button>
      {error && <Alert title="Something went wrong:">{error}</Alert>}
    </div>
  );
};
