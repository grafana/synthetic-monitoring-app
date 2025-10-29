import React from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { FrequencyComponentProps } from './Frequency.types';
import { formatDuration } from 'utils';

import { FREQUENCY_OPTIONS } from './Frequency.constants';

export const FrequencyBasic = ({ value, onChange, min, max, disabled }: FrequencyComponentProps) => {
  return (
    <RadioButtonGroup
      data-form-name="frequency"
      options={FREQUENCY_OPTIONS.filter((option) => option >= min && option <= max).map((option) => ({
        label: formatDuration(option, true),
        value: option,
      }))}
      disabledOptions={FREQUENCY_OPTIONS.filter((option) => option < min || option > max)}
      value={value}
      onChange={(value) => onChange(value)}
      disabled={disabled}
    />
  );
};
