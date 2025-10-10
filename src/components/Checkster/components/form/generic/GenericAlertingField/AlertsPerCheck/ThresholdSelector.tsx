import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InlineField, Input } from '@grafana/ui';
import { trackChangeThreshold } from 'features/tracking/perCheckAlertsEvents';
import { useDebounceCallback } from 'usehooks-ts';

import { CheckFormValues } from 'types';

import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

interface ThresholdSelectorProps {
  alert: PredefinedAlertInterface;
  selected: boolean;
  suffix?: string;
  width?: number;
}

export const ThresholdSelector: React.FC<ThresholdSelectorProps> = ({ alert, selected, suffix, width = 5 }) => {
  const { formState, control } = useFormContext<CheckFormValues>();
  const isFormDisabled = formState.disabled;
  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;

  const debouncedTrackChangeThreshold = useDebounceCallback(trackChangeThreshold, 750);

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
            suffix={suffix}
            type="number"
            step="any"
            id={`alert-threshold-${alert.type}`}
            onChange={(e) => {
              const value = e.currentTarget.value;
              debouncedTrackChangeThreshold({ name: alert.type, threshold: value });
              return field.onChange(value !== '' ? Number(value) : '');
            }}
            width={width}
            disabled={!selected || isFormDisabled}
          />
        )}
      />
    </InlineField>
  );
};
