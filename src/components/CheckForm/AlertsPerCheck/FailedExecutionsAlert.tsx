import React, { useCallback, useMemo } from 'react';
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
import { useRevalidateForm } from 'hooks/useRevalidateForm';

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
  const { getValues, control, formState } = useFormContext<CheckFormValues>();
  const revalidateForm = useRevalidateForm();
  const styles = useStyles2(getAlertItemStyles);

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const checkFrequency = getValues('frequency');
  const probes = getValues('probes');
  const threshold = getValues(`alerts.${alert.type}.threshold`);
  const period = getValues(`alerts.${alert.type}.period`);

  const convertPeriod = useCallback((period: string) => durationToMilliseconds(parseDuration(period)), []);

  //min time range >= check frequency
  const validPeriods = useMemo(
    () =>
      ALERT_PERIODS.map((period) => {
        const isValid = convertPeriod(period.value) >= checkFrequency;

        return {
          ...period,
          isDisabled: !isValid,
          description: !isValid ? 'Invalid' : undefined,
        };
      }),
    [checkFrequency, convertPeriod]
  );

  const testExecutionsPerPeriod = useMemo(() => {
    if (!period) {
      return '';
    }

    return getTotalChecksPerPeriod(probes.length, checkFrequency, convertPeriod(period));
  }, [checkFrequency, period, probes, convertPeriod]);

  const periodError = formState.errors?.alerts?.[alert.type]?.period?.message;

  return (
    <Stack direction={'column'}>
      <InlineFieldRow className={styles.alertRow}>
        <Checkbox
          aria-label={`Enable ${alert.name} alert`}
          className={styles.alertCheckbox}
          id={`alert-${alert.type}`}
          data-testid={`checkbox-alert-${alert.type}`}
          onClick={() => handleToggleAlert(alert.type)}
          checked={selected}
        />
        <Text>Alert if at least</Text> <ThresholdSelector alert={alert} selected={selected} />
        <div style={{ whiteSpace: 'break-spaces' }}>
          <Stack direction="row" alignItems="center" gap={0}>
            {testExecutionsPerPeriod !== 0 && (
              <Text color={selected ? `warning` : undefined}>{`of ${testExecutionsPerPeriod} `}</Text>
            )}
            <Text>
              {testExecutionsPerPeriod
                ? `probe ${pluralize('execution', testExecutionsPerPeriod)}`
                : pluralize(' execution', threshold)}{' '}
              fail
              {threshold === 1 && 's'} in the last
            </Text>
          </Stack>
        </div>
        <InlineField
          htmlFor={`alert-period-${alert.type}`}
          invalid={!!periodError}
          error={periodError}
          validationMessageHorizontalOverflow={true}
        >
          <Controller
            name={`alerts.${alert.type}.period`}
            control={control}
            render={({ field }) => {
              const { ref, ...fieldProps } = field; // ref is unused, this is to silence warnings

              return (
                <Select
                  {...fieldProps}
                  disabled={!selected || isFormDisabled}
                  data-testid="alertPendingPeriod"
                  id={`alert-period-${alert.type}`}
                  options={validPeriods}
                  value={field.value}
                  onChange={({ value = null } = {}) => {
                    field.onChange(value);

                    // clear threshold error if new period is valid
                    revalidateForm<CheckFormValues>(`alerts.${alert.type}`);
                  }}
                />
              );
            }}
          />
        </InlineField>
        <div className={styles.alertTooltip}>
          <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
            <Icon name="info-circle" />
          </Tooltip>
        </div>
      </InlineFieldRow>

      {selected && !!testExecutionsPerPeriod && (
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
