import React, { useState } from 'react';
import { Alert, Button } from '@grafana/ui';
import { HostedInstance } from 'types';
import { InstanceList } from 'components/InstanceList';

interface Props {
  logsInstances: HostedInstance[];
  metricsInstances: HostedInstance[];
  onSubmit: (metricsId?: number, logsId?: number) => void;
  error?: string;
}

export const InstanceSelection = ({ logsInstances, metricsInstances, onSubmit, error }: Props) => {
  const [selectedMetricsInstance, setSelectedMetricsInstance] = useState<number | undefined>(metricsInstances?.[0].id);

  const [selectedLogsInstance, setSelectedLogsInstance] = useState<number | undefined>(logsInstances?.[0].id);

  return (
    <div>
      <div>Select the Grafana Cloud instances Synthetic Monitoring will send data to</div>

      <h4>Metrics</h4>
      <InstanceList
        instances={metricsInstances}
        onSelected={setSelectedMetricsInstance}
        selected={selectedMetricsInstance}
      />

      <h4>Logs</h4>
      <InstanceList instances={logsInstances} onSelected={setSelectedLogsInstance} selected={selectedLogsInstance} />
      <br />
      <br />
      <Button
        variant="primary"
        onClick={() => {
          onSubmit(selectedMetricsInstance, selectedLogsInstance);
        }}
      >
        Setup
      </Button>
      {error && <Alert title="There was a problem with the instance selection">{error}</Alert>}
    </div>
  );
};
