import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { validateTimeout } from 'validation';
import { SliderInput } from 'components/SliderInput';

interface Props {
  checkType: CheckType;
}

export const Timeout = ({ checkType }: Props) => {
  const {
    formState: { errors },
    register,
  } = useFormContext<CheckFormValues>();
  const isTraceroute = checkType === CheckType.Traceroute;
  const { minTimeout, maxTimeout } = getTimeoutBounds(checkType);

  return (
    <Field
      label="Timeout"
      description="Maximum execution time for a check"
      invalid={Boolean(errors.timeout)}
      error={errors.timeout?.message}
      htmlFor={`timeout`}
    >
      {isTraceroute ? (
        <Input {...register(`timeout`)} readOnly prefix="Every" suffix="seconds" width={18} id={`timeout`} />
      ) : (
        <SliderInput
          name="timeout"
          validate={(value) => validateTimeout(value, maxTimeout, minTimeout)}
          max={maxTimeout}
          min={minTimeout}
          step={1}
        />
      )}
    </Field>
  );
};

function getTimeoutBounds(checkType: CheckType) {
  if (checkType === CheckType.Traceroute) {
    return {
      minTimeout: 30.0,
      maxTimeout: 30.0,
    };
  }
  if (checkType === CheckType.Scripted || checkType === CheckType.MULTI_HTTP) {
    return {
      minTimeout: 5.0,
      maxTimeout: 60.0,
    };
  }
  return {
    minTimeout: 1.0,
    maxTimeout: 60.0,
  };
}
