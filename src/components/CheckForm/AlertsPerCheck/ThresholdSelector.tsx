import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InlineField, Input } from '@grafana/ui';
import { trackChangeThreshold } from 'features/tracking/perCheckAlertsEvents';

import { CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

interface ThresholdSelectorProps {
  alert: PredefinedAlertInterface;
  selected: boolean;
}

export const ThresholdSelector: React.FC<ThresholdSelectorProps> = ({ alert, selected }) => {
  const { isFormDisabled } = useCheckFormContext();

  const { formState, control } = useFormContext<CheckFormValues>();

  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;

  return (
    <InlineField
      htmlFor={`alert-threshold-${alert.type}`}
      invalid={!!thresholdError}
      error={thresholdError}
      validationMessageHorizontalOverflow={true}
    >
      <Controller
        name={`alerts.${alert.type}.threshold`}
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            aria-disabled={!selected}
            data-testid={`alert-threshold-${alert.type}`}
            type="number"
            step="any"
            id={`alert-threshold-${alert.type}`}
            onChange={(e) => {
              const value = e.currentTarget.value;
              trackChangeThreshold({ name: alert.type, threshold: value !== '' ? Number(value) : 0 });
              return field.onChange(value !== '' ? Number(value) : '');
            }}
            width={5}
            disabled={!selected || isFormDisabled}
          />
        )}
      />
    </InlineField>
  );
};
