import React, { useCallback, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import {
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
import { trackChangePeriod } from 'features/tracking/perCheckAlertsEvents';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues } from 'types';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { ALERT_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { getAlertItemStyles } from './AlertsPerCheck.styles';
import { ThresholdSelector } from './ThresholdSelector';

export const RequestDurationTooHighAvgAlert = ({
  alert,
  selected,
  tooltipContent,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  tooltipContent: PopoverContent;
}) => {
  const { getValues, control, formState } = useFormContext<CheckFormValues>();
  const revalidateForm = useRevalidateForm();

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

  const {
    field: { ref: periodRef, ...periodField },
  } = useController({ control, name: `alerts.${alert.type}.period` });

  return (
    <Stack direction={'column'}>
      <InlineFieldRow className={styles.alertRow}>
        <Text>Alert if the average {checkType} request duration exceeds </Text>{' '}
        <ThresholdSelector alert={alert} selected={selected} suffix={alert.unit} width={9} />
        <Text>over the last </Text>
        <InlineField
          htmlFor={`alert-period-${alert.type}`}
          invalid={!!periodError}
          error={periodError}
          validationMessageHorizontalOverflow={true}
          disabled={!selected || isFormDisabled}
        >
          <Combobox
            {...periodField}
            aria-label={`${alert.category} period`}
            data-testid={CHECKSTER_TEST_ID.feature.perCheckAlerts[alert.type].periodCombobox}
            id={`alert-period-${alert.type}`}
            options={validPeriods}
            value={periodField.value}
            width="auto"
            minWidth={8}
            maxWidth={10}
            onChange={(option: { value?: string | null }) => {
              const value = option.value ?? null;
              periodField.onChange(value);
              trackChangePeriod({ name: alert.type, period: value ?? '' });
              // clear threshold error if new period is valid
              revalidateForm<CheckFormValues>(`alerts.${alert.type}`);
            }}
          />
        </InlineField>
        <div className={styles.alertTooltip}>
          <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
            <Icon name="info-circle" />
          </Tooltip>
        </div>
      </InlineFieldRow>
    </Stack>
  );
};
