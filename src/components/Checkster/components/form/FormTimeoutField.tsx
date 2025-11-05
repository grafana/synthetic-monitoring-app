import React, { useEffect } from 'react';
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
    setValue,
    getValues,
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
  const readOnlyValue = isReadonly ? getValues(field) : undefined;
  // New checks can switch between check types, hence causing an invalid state
  // ReadOnly but no way to change the invalid value

  useEffect(() => {
    if (readOnlyValue !== undefined && (readOnlyValue > max || readOnlyValue < min)) {
      // At this moment, readOnly means that min and max are identical
      // Let's still make sure this effect works if that assumption no longer holds true
      setValue(field, Math.max(min, Math.min(readOnlyValue, max)), { shouldDirty: true });
    }
  }, [field, max, min, readOnlyValue, setValue]);

  return (
    <StyledField
      label="Timeout"
      description="Maximum execution time for the check"
      {...getFieldErrorProps(errors, field)}
      htmlFor={field}
    >
      {isReadonly ? (
        <Input id={field} width={20} disabled {...fieldProps} value={valueInSeconds} suffix="Seconds" />
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
