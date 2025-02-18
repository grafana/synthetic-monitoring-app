import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, InlineField, Input, Select, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { ALERT_PENDING_PERIODS, PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const FailedExecutionsAlert = ({
  alert,
  selected,
  onSelectionChange,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
}) => {
  const { control, formState } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const styles = useStyles2(getStyles);

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;

  return (
    <Stack alignItems="center">
      <Checkbox id={`alert-${alert.type}`} onClick={() => handleToggleAlert(alert.type)} checked={selected} />
      <Stack alignItems="center">
        Trigger an alert if more than{' '}
        <InlineField
          htmlFor={`alert-threshold-${alert.type}`}
          invalid={!!thresholdError}
          error={thresholdError}
          className={styles.inlineInput}
        >
          <Controller
            name={`alerts.${alert.type}.threshold`}
            control={control}
            render={({ field }) => {
              return (
                <Input
                  {...field}
                  aria-disabled={!selected}
                  suffix={alert.unit}
                  type="number"
                  step="any"
                  id={`alert-threshold-${alert.type}`}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    return field.onChange(value !== '' ? Number(value) : '');
                  }}
                  width={10}
                  disabled={!selected || isFormDisabled}
                />
              );
            }}
          />
        </InlineField>
        of tests have failed for the last
        <Select
          disabled={!selected || isFormDisabled}
          data-testid="alertPendingPeriod"
          options={ALERT_PENDING_PERIODS}
          defaultValue={ALERT_PENDING_PERIODS[0]}
          onChange={(e) => {}}
        />
      </Stack>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  inlineInput: css({
    margin: 0,
  }),
});
