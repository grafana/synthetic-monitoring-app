import React, { FC, useState, useContext } from 'react';
import { Button, Alert } from '@grafana/ui';
import { getBackendSrv } from '@grafana/runtime';
import { initializeDatasource } from 'utils';
import { importAllDashboards } from 'dashboards/loader';
import { InstanceContext } from 'components/InstanceContext';

interface Props {}

export const WelcomePage: FC<Props> = () => {
  const [error, setError] = useState('');
  const { meta } = useContext(InstanceContext);

  const onClick = async () => {
    console.log('calling on click');
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

      await initializeDatasource(datasourcePayload, dashboards);

      // force reload so that GrafanaBootConfig is updated.
      window.location.reload();
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
