import React, { useCallback, useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import {
  Checkbox,
  Combobox,
  Icon,
  InlineField,
  InlineFieldRow,
  PopoverContent,
  Stack,
  Text,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import {
  trackChangePeriod,
  trackSelectAlert,
  trackUnSelectAlert,
} from 'features/tracking/perCheckAlertsEvents';

import { CheckAlertType, CheckFormValues } from 'types';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { getAlertItemStyles } from './AlertItem';
import { ALERT_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { RunbookUrl } from './RunbookUrl';
import { ThresholdSelector } from './ThresholdSelector';

export const RequestDurationTooHighAvgAlert = ({
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
  const { getValues, control, formState } = useFormContext<CheckFormValues>();
  const revalidateForm = useRevalidateForm();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
    if (selected) {
      trackUnSelectAlert({ name: type });
    } else {
      trackSelectAlert({ name: type });
    }
  };

  const isFormDisabled = formState.disabled;
  const styles = useStyles2(getAlertItemStyles);

  const convertPeriod = useCallback((period: string) => durationToMilliseconds(parseDuration(period)), []);
  const checkFrequency = getValues('frequency');
  const checkType = getValues('checkType');
  const periodError = formState.errors?.alerts?.[alert.type]?.period?.message;

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
        <Text>Alert if the average {checkType} request duration exceeds </Text>{' '}
        <ThresholdSelector alert={alert} selected={selected} suffix={alert.unit} width={9} />
        <Text>over the last </Text>
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
                <Combobox
                  {...fieldProps}
                  disabled={!selected || isFormDisabled}
                  data-testid="alertPendingPeriod"
                  id={`alert-period-${alert.type}`}
                  options={validPeriods}
                  value={field.value}
                  onChange={(option) => {
                    const value = option?.value ?? null;
                    field.onChange(value);
                    trackChangePeriod({ name: alert.type, period: value ?? '' });
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
      <RunbookUrl alertType={alert.type} selected={selected} disabled={isFormDisabled} />
    </Stack>
  );
};
