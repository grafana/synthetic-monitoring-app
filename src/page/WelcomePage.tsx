import React, { FC, useState, useContext } from 'react';
import { Button, Alert } from '@grafana/ui';
import { getBackendSrv, getLocationSrv } from '@grafana/runtime';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';
import { initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'components/InstanceContext';

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const [error, setError] = useState('');
  const { meta, updateApiDatasource } = useContext(InstanceContext);

  const onClick = async () => {
    if (!meta?.jsonData) {
      setError('Invalid plugin configuration');
      return;
    }
    const body = {
      stackId: parseInt(meta.jsonData.grafanaInstanceId ?? '1', 10),
      metricsInstanceId: meta.jsonData.metrics.hostedId,
      logsInstanceId: meta.jsonData.logs.hostedId,
    };
    try {
      const { accessToken } = await getBackendSrv().request({
        url: `api/plugin-proxy/${meta.id}/register`,
        method: 'POST',
        data: body,
      });
      const dashboards = await importAllDashboards(meta.jsonData.metrics.grafanaName, meta.jsonData.logs.grafanaName);
      const datasourcePayload = {
        apiHost: meta.jsonData.apiHost,
        accessToken,
        metrics: meta.jsonData.metrics,
        logs: meta.jsonData.logs,
      };
      const response = await initializeDatasource(datasourcePayload, dashboards);

      updateApiDatasource(response.datasource);
      getLocationSrv().update({
        partial: false,
        query: { page: 'checks' },
      });
    } catch (e) {
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
