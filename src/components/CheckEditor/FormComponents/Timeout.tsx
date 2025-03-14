import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { TimeSlider } from 'components/TimeSlider/TimeSlider';

import { MAX_TIMEOUT_MAP, MIN_TIMEOUT_MAP } from './Timeout.constants';

interface TimeoutProps {
  checkType: CheckType;
}

export const Timeout = ({ checkType }: TimeoutProps) => {
  const {
    formState: { errors },
    control,
  } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const min = MIN_TIMEOUT_MAP[checkType];
  const max = MAX_TIMEOUT_MAP[checkType];
  const readOnly = min === max;

  return (
    <Field
      description="Maximum execution time for a check"
      error={errors.timeout?.message}
      htmlFor={`timeout`}
      invalid={Boolean(errors.timeout)}
      label="Timeout"
    >
      <Controller
        name="timeout"
        control={control}
        render={({ field }) => {
          const valueInSeconds = field.value / 1000;
          const minInSeconds = min / 1000;
          const maxInSeconds = max / 1000;
          const handleOnChange = (value: number) => {
            field.onChange(value * 1000);
          };

          if (readOnly) {
            return (
              <Input
                {...field}
                value={valueInSeconds}
                id={`timeout`}
                prefix="Every"
                readOnly
                suffix="seconds"
                width={18}
              />
            );
          }
          return (
            <TimeSlider
              disabled={isFormDisabled}
              min={minInSeconds}
              max={maxInSeconds}
              {...field}
              value={valueInSeconds}
              onChange={handleOnChange}
              analyticsLabel="timeout"
              ariaLabelForHandle="timeout"
            />
          );
        }}
      />
    </Field>
  );
};
