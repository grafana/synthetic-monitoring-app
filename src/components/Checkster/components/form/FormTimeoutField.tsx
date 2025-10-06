import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Input } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { TimeSlider } from 'components/TimeSlider';

import { getFieldErrorProps } from '../../utils/form';
import { StyledField } from '../ui/StyledField';

interface FormTimeoutFieldProps {
  field: 'timeout';
  min: number;
  max: number;
}

export function FormTimeoutField({ field, min, max }: FormTimeoutFieldProps) {
  const {
    formState: { errors, disabled },
    control,
  } = useFormContext<CheckFormValues>();

  const {
    field: { ref, value, onChange, ...fieldProps }, // ref is unused, this is to silence warnings
  } = useController({ name: field, control });

  const handleOnChange = (newValue: number) => {
    onChange(newValue * 1000);
  };

  const valueInSeconds = (value as number) / 1000;
  const minInSeconds = min / 1000;
  const maxInSeconds = max / 1000;

  // TODO: Handle "readOnly" (traceroute) - When min and max are the same, disable the slider and show a tooltip explaining why
  const isReadonly = min >= max;

  return (
    <StyledField
      label="Timeout"
      description="Maximum execution time for the check"
      {...getFieldErrorProps(errors, field)}
    >
      {isReadonly ? (
        <Input width={20} disabled {...fieldProps} value={valueInSeconds} suffix="Seconds" />
      ) : (
        <TimeSlider
          {...fieldProps}
          disabled={disabled}
          value={valueInSeconds}
          analyticsLabel="timeout"
          ariaLabelForHandle="timeout"
          min={minInSeconds}
          max={maxInSeconds}
          onChange={handleOnChange}
        />
      )}
    </StyledField>
  );
}
