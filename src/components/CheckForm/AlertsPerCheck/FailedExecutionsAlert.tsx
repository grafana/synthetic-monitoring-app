import React, { useCallback, useEffect, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import {
  Checkbox,
  Icon,
  InlineField,
  InlineFieldRow,
  PopoverContent,
  Select,
  Stack,
  Text,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { getTotalChecksPerPeriod } from 'checkUsageCalc';
import pluralize from 'pluralize';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { AlertEvaluationInfo } from './AlertEvaluationInfo';
import { getAlertItemStyles } from './AlertItem';
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
  const { getValues, setValue, control, formState } = useFormContext<CheckFormValues>();
  const styles = useStyles2(getAlertItemStyles);

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const checkFrequency = getValues('frequency');
  const probes = getValues('probes');
  const threshold = getValues(`alerts.${alert.type}.threshold`);
  const period = getValues(`alerts.${alert.type}.period`);

  const convertPeriodToSeconds = useCallback(
    (period: string) => durationToMilliseconds(parseDuration(period)) / 1000,
    []
  );

  //min time range >= check frequency
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

  const periodError = formState.errors?.alerts?.[alert.type]?.period?.message;

  return (
    <Stack direction={'column'}>
      <InlineFieldRow className={styles.alertRow}>
        <Checkbox
          className={styles.alertCheckbox}
          id={`alert-${alert.type}`}
          data-testid={`checkbox-alert-${alert.type}`}
          onClick={() => handleToggleAlert(alert.type)}
          checked={selected}
        />
        <Text>Alert if at least</Text> <ThresholdSelector alert={alert} selected={selected} />
        <Text>
          {testExecutionsPerPeriod
            ? `of ${testExecutionsPerPeriod} ${pluralize('execution', testExecutionsPerPeriod)}`
            : pluralize('execution', threshold)}{' '}
          fail
          {threshold === 1 && 's'} in the last
        </Text>
        <InlineField
          htmlFor={`alert-period-${alert.type}`}
          invalid={!!periodError}
          error={periodError}
          validationMessageHorizontalOverflow={true}
        >
          <Controller
            name={`alerts.${alert.type}.period`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                disabled={!selected || isFormDisabled}
                data-testid="alertPendingPeriod"
                id={`alert-period-${alert.type}`}
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
        </InlineField>
        <div className={styles.alertTooltip}>
          <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
            <Icon name="info-circle" />
          </Tooltip>
        </div>
      </InlineFieldRow>

      {selected && testExecutionsPerPeriod !== '' && (
        <AlertEvaluationInfo
          testExecutionsPerPeriod={testExecutionsPerPeriod}
          checkFrequency={checkFrequency}
          period={period}
          probesNumber={probes.length}
        />
      )}
    </Stack>
  );
};
