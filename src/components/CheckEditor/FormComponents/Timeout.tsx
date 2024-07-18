import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { validateTimeout } from 'validation';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { SliderInput } from 'components/SliderInput';

interface TimeoutProps {
  min?: number;
  max?: number;
}

export const Timeout = ({ min = 1.0, max = 60.0 }: TimeoutProps) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const readOnly = min === max;

  return (
    <Field
      description="Maximum execution time for a check"
      error={errors.timeout?.message}
      htmlFor={`timeout`}
      invalid={Boolean(errors.timeout)}
      label="Timeout"
    >
      {readOnly ? (
        <Input
          {...register(`timeout`, { valueAsNumber: true })}
          id={`timeout`}
          prefix="Every"
          readOnly
          suffix="seconds"
          width={18}
        />
      ) : (
        <SliderInput
          disabled={isFormDisabled}
          max={max}
          min={min}
          name="timeout"
          step={1}
          validate={(value) => validateTimeout(value, max, min)}
        />
      )}
    </Field>
  );
};
