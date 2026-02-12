import React, { useCallback, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
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
import { getTotalChecksPerPeriod } from 'checkUsageCalc';
import { trackChangePeriod, trackSelectAlert, trackUnSelectAlert } from 'features/tracking/perCheckAlertsEvents';
import pluralize from 'pluralize';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckAlertType, CheckFormValuesWithAlert } from 'types';
import { useRevalidateForm } from 'hooks/useRevalidateForm';

import { AlertEvaluationInfo } from './AlertEvaluationInfo';
import { getAlertItemStyles } from './AlertItem';
import { ALERT_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { RunbookUrl } from './RunbookUrl';
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
  const { formState, getValues, control } = useFormContext<CheckFormValuesWithAlert<typeof alert.type>>();
  const revalidateForm = useRevalidateForm();
  const styles = useStyles2(getAlertItemStyles);

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
    if (selected) {
      trackUnSelectAlert({ name: type });
    } else {
      trackSelectAlert({ name: type });
    }
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

  const {
    field: { ref: periodRef, ...periodField },
  } = useController({ control, name: `alerts.${alert.type}.period` });

  return (
    <Stack direction={'column'}>
      <InlineFieldRow className={styles.alertRow}>
        <Checkbox
          aria-label={`Enable ${alert.name} alert`}
          className={styles.alertCheckbox}
          id={`alert-${alert.type}`}
          data-testid={CHECKSTER_TEST_ID.feature.perCheckAlerts[alert.type].selectedCheckbox}
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
          <Combobox
            {...periodField}
            disabled={!selected || formState.disabled}
            data-testid={CHECKSTER_TEST_ID.feature.perCheckAlerts[alert.type].periodCombobox}
            id={`alert-period-${alert.type}`}
            options={validPeriods}
            value={periodField.value}
            width="auto"
            minWidth={8}
            maxWidth={10}
            onChange={({ value = null }: { value?: string | null }) => {
              periodField.onChange(value);
              trackChangePeriod({ name: alert.type, period: value ?? '' });
              // clear threshold error if new period is valid
              revalidateForm<CheckFormValuesWithAlert<typeof alert.type>>(`alerts.${alert.type}`);
            }}
          />
        </InlineField>
        <div className={styles.alertTooltip}>
          <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
            <Icon name="info-circle" />
          </Tooltip>
        </div>
      </InlineFieldRow>
      <RunbookUrl alertType={alert.type} selected={selected} disabled={formState.disabled} />

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
