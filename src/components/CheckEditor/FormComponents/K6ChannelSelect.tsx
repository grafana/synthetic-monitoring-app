import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Combobox, Field } from '@grafana/ui';

import { CheckFormValues, FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

interface K6ChannelSelectProps {
  disabled?: boolean;
}

export function K6ChannelSelect({ disabled }: K6ChannelSelectProps) {
  const { isEnabled } = useFeatureFlag(FeatureName.VersionManagement);
  const { control } = useFormContext<CheckFormValues>();
  const id = 'k6-channel-select';
  
  // TODO: Add actual channel data and validation logic
  const mockChannelOptions = useMemo(() => [
    {
      label: 'Probe Default',
      value: '', // Use empty string instead of null for Combobox
      description: 'Use the default k6 version of each probe',
    },
    {
      label: 'v1.x (v1.9.2)',
      value: 'v1',
      description: 'k6 version range: k6>=1',
    },
    {
      label: 'v2.x (v2.0.1)',
      value: 'v2', 
      description: 'k6 version range: k6>=2',
    },
  ], []);

  // Don't render if feature flag is disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <Field
      label="k6 Version"
      description="Select the k6 version channel for this check"
      htmlFor={id}
      data-fs-element="k6 channel select"
    >
      <Controller
        name="channel"
        control={control}
        render={({ field, fieldState }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Combobox
              {...rest}
              disabled={disabled}
              options={mockChannelOptions}
              id={id}
              onChange={(value) => onChange(value)}
              placeholder="Select k6 version channel"
              invalid={!!fieldState.error}
            />
          );
        }}
      />
    </Field>
  );
}
