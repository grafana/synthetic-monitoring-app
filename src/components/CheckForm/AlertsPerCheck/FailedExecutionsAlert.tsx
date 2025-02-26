import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { Checkbox, Select, Stack } from '@grafana/ui';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { ALERT_PENDING_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { ThresholdSelector } from './ThresholdSelector';

export const FailedExecutionsAlert = ({
  alert,
  selected,
  onSelectionChange,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
}) => {
  const { isFormDisabled } = useCheckFormContext();
  const { getValues } = useFormContext<CheckFormValues>();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const checkFrequency = getValues('frequency');

  //min time range >= 2.5 * check frequency
  const convertPeriodToSeconds = (period: { label: string; value: string }) =>
    durationToMilliseconds(parseDuration(period.value)) / 1000;

  const validPendingPeriods = useMemo(
    () => ALERT_PENDING_PERIODS.filter((period) => convertPeriodToSeconds(period) >= checkFrequency * 2.5),
    [checkFrequency]
  );

  return (
    <Stack alignItems="center">
      <Checkbox
        id={`alert-${alert.type}`}
        data-testid={`checkbox-alert-${alert.type}`}
        onClick={() => handleToggleAlert(alert.type)}
        checked={selected}
      />
      <Stack alignItems="center">
        Trigger an alert if more than <ThresholdSelector alert={alert} selected={selected} />
        of tests fail for
        <Select
          disabled={!selected || isFormDisabled}
          data-testid="alertPendingPeriod"
          options={validPendingPeriods}
          defaultValue={validPendingPeriods[0]}
          onChange={(e) => {}}
        />
      </Stack>
    </Stack>
  );
};
