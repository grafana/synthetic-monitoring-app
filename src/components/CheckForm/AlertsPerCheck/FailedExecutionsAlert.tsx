import React, { useCallback, useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { Checkbox, Icon, PopoverContent, Select, Stack, Tooltip } from '@grafana/ui';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';
import pluralize from 'pluralize';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { ALERT_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';
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
  const { getValues, setValue, control } = useFormContext<CheckFormValues>();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const checkFrequency = getValues('frequency');
  const probes = getValues('probes');
  const threshold = getValues(`alerts.${alert.type}.threshold`);
  const period = getValues(`alerts.${alert.type}.period`);

  //min time range >= check frequency
  const convertPeriodToSeconds = useCallback(
    (period: string) => durationToMilliseconds(parseDuration(period)) / 1000,
    []
  );

  const validPeriods = useMemo(
    () => ALERT_PERIODS.filter((period) => convertPeriodToSeconds(period.value) >= checkFrequency),
    [checkFrequency, convertPeriodToSeconds]
  );

  useEffect(() => {
    if (!validPeriods.length || period !== undefined) {
      return;
    }

    const defaultPeriod = validPeriods[0].value;
    // @ts-expect-error
    setValue(`alerts.${alert.type}.period`, defaultPeriod);
  }, [validPeriods, setValue, alert.type, period]);

  const testExecutionsPerPeriod = useMemo(() => {
    if (!period) {
      return '';
    }
    return getTotalChecksPerPeriod(probes.length, checkFrequency, convertPeriodToSeconds(period));
  }, [checkFrequency, period, probes, convertPeriodToSeconds]);

  const customTooltipContent: PopoverContent = (
    <div>
      The number of test executions is an approximation based on the check&apos;s frequency and the period chosen for
      this alert.
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
          Alert if at least <ThresholdSelector alert={alert} selected={selected} />
          {testExecutionsPerPeriod
            ? `of ${testExecutionsPerPeriod} ${pluralize('execution', testExecutionsPerPeriod)}`
            : null}{' '}
          fail
          {threshold === 1 && 's'} in the last
          <Controller
            name={`alerts.${alert.type}.period`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                disabled={!selected || isFormDisabled}
                data-testid="alertPendingPeriod"
                options={validPeriods}
                value={field.value}
                onChange={(value) => {
                  if (value === null) {
                    return field.onChange(null);
                  }
                  field.onChange(value.value);
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
