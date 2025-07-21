import React, { useCallback } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { TimeSlider } from 'components/TimeSlider/TimeSlider';

import { MAX_TIMEOUT_MAP, MIN_TIMEOUT_MAP } from './Timeout.constants';

interface TimeoutProps {
  checkType: CheckType;
}

export const Timeout = ({ checkType }: TimeoutProps) => {
  const {
    formState: { errors, disabled: isFormDisabled },
    control,
  } = useFormContext<CheckFormValues>();
  const { field } = useController({ name: 'timeout', control });
  const min = MIN_TIMEOUT_MAP[checkType];
  const max = MAX_TIMEOUT_MAP[checkType];
  const readOnly = min === max;

  const { ref, onChange, value, ...fieldProps } = field; // ref is unused, this is to silence warnings
  const valueInSeconds = value / 1000;
  const minInSeconds = min / 1000;
  const maxInSeconds = max / 1000;

  const handleOnChange = useCallback(
    (v: number) => {
      onChange(v * 1000);
    },
    [onChange]
  );

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
          {...fieldProps}
          value={valueInSeconds}
          id={`timeout`}
          prefix="Every"
          readOnly
          suffix="seconds"
          width={18}
        />
      ) : (
        <TimeSlider
          disabled={isFormDisabled}
          min={minInSeconds}
          max={maxInSeconds}
          {...fieldProps}
          value={valueInSeconds}
          onChange={handleOnChange}
          analyticsLabel="timeout"
          ariaLabelForHandle="timeout"
        />
      )}
    </Field>
  );
};
