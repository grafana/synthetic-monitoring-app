import React from 'react';
import { RadioButtonGroup } from '@grafana/ui';

import { formatDuration } from 'utils';
import { FREQUENCY_OPTIONS } from 'components/CheckEditor/FormComponents/Frequency.constants';
import { FrequencyComponentProps } from 'components/CheckEditor/FormComponents/Frequency.types';

export const FrequencyBasic = ({ value, onChange, min, max }: FrequencyComponentProps) => {
  return (
    <RadioButtonGroup
      options={FREQUENCY_OPTIONS.filter((option) => option >= min && option <= max).map((option) => ({
        label: formatDuration(option, true),
        value: option,
      }))}
      disabledOptions={FREQUENCY_OPTIONS.filter((option) => option < min || option > max)}
      value={value}
      onChange={(value) => onChange(value)}
    />
  );
};
