import React from 'react';
import { Stack } from '@grafana/ui';

import { CheckAlertFormValues, CheckAlertType } from 'types';

import { AlertItem } from './AlertItem';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const AlertsList = ({
  alerts,
  selectedAlerts,
  onSelectionChange,
}: {
  alerts: PredefinedAlertInterface[];
  selectedAlerts?: Partial<Record<CheckAlertType, CheckAlertFormValues>>;
  onSelectionChange: (type: CheckAlertType) => void;
}) => (
  <Stack direction="column" gap={2}>
    {alerts.map((alert) => (
      <AlertItem
        key={alert.type}
        alert={alert}
        selected={!!selectedAlerts?.[alert.type]?.isSelected}
        onSelectionChange={onSelectionChange}
      />
    ))}
  </Stack>
);
