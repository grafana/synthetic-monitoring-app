import React from 'react';
import { Stack, useStyles2 } from '@grafana/ui';

import { Check } from 'types';

import { getStyles } from './AlertStatus';

export const PerCheckAlerts = ({ alerts }: { alerts: Check['Alerts'] }) => {
  const styles = useStyles2(getStyles);
  return (
    <Stack direction="column" gap={2}>
      <h3 className={styles.title}>Per-check alerts</h3>
      {alerts && alerts.length > 0 && (
        <Stack direction="column" gap={1}>
          {alerts.map((alert) => (
            <div key={alert.name}>{alert.name}</div>
          ))}
        </Stack>
      )}
      {alerts && alerts.length === 0 && <div>No per-check alerts defined for this check</div>}
    </Stack>
  );
};
