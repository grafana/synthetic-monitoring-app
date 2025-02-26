import React, { useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { Checkbox, Icon, PopoverContent, Select, Stack, Tooltip } from '@grafana/ui';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { ALERT_PENDING_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { ThresholdSelector } from './ThresholdSelector';

export const FailedExecutionsAlert = ({
  alert,
  selected,
  onSelectionChange,
  tooltipContent,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
  tooltipContent: PopoverContent;
}) => {
  const { isFormDisabled } = useCheckFormContext();
  const { getValues, control } = useFormContext<CheckFormValues>();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const checkFrequency = getValues('frequency');
  const probes = getValues('probes');

  //min time range >= 2.5 * check frequency
  const convertPeriodToSeconds = useCallback(
    (period: string) => durationToMilliseconds(parseDuration(period)) / 1000,
    []
  );

  const validPendingPeriods = useMemo(
    () => ALERT_PENDING_PERIODS.filter((period) => convertPeriodToSeconds(period.value) >= checkFrequency * 2.5),
    [checkFrequency, convertPeriodToSeconds]
  );

  const defaultPeriod = validPendingPeriods[0];
  const period = getValues(`alerts.${alert.type}.period`) || defaultPeriod.value;

  const testExecutionsPerPeriod = useMemo(() => {
    if (!period) {
      return '';
    }
    return getTotalChecksPerPeriod(probes.length, checkFrequency, convertPeriodToSeconds(period));
  }, [checkFrequency, period, probes, convertPeriodToSeconds]);

  const customTooltipContent: PopoverContent = (
    <div>
      The number of test executions is an approximation based on the check&apos;s frequency and the pending period
      chosen for this alert.
      {tooltipContent as React.ReactNode}
    </div>
  );

  return (
    <Stack alignItems="center">
      <Stack alignItems="center">
        <Checkbox
          id={`alert-${alert.type}`}
          data-testid={`checkbox-alert-${alert.type}`}
          onClick={() => handleToggleAlert(alert.type)}
          checked={selected}
        />
        <Stack alignItems="center">
          Trigger an alert if more than <ThresholdSelector alert={alert} selected={selected} />
          of {testExecutionsPerPeriod} tests fail for
          <Controller
            name={`alerts.${alert.type}.period`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                disabled={!selected || isFormDisabled}
                data-testid="alertPendingPeriod"
                options={validPendingPeriods}
                defaultValue={defaultPeriod.value}
                value={field.value || defaultPeriod.value}
                onChange={(value) => {
                  if (value === null) {
                    return field.onChange(null);
                  }
                  field.onChange(value?.value);
                }}
              />
            )}
          />
        </Stack>
      </Stack>
      <Tooltip content={customTooltipContent} placement="bottom" interactive={true}>
        <Icon name="info-circle" />
      </Tooltip>
    </Stack>
  );
};
