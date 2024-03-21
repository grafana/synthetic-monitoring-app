import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';
import { useProbes } from 'data/useProbes';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';

import CheckProbes from './CheckProbes';

interface Props {
  isEditor: boolean;
  timeout: number;
  frequency: number;
  checkType: CheckType;
}

function getFrequencyBounds(checkType: CheckType) {
  const oneHour = 60 * 60;
  if (checkType === CheckType.Traceroute) {
    return {
      minFrequency: 60.0,
      maxFrequency: oneHour,
    };
  }
  if (checkType === CheckType.MULTI_HTTP || checkType === CheckType.Scripted) {
    return {
      minFrequency: 60.0,
      maxFrequency: oneHour,
    };
  }
  return {
    minFrequency: 10.0,
    maxFrequency: oneHour,
  };
}

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

export const ProbeOptions = ({ frequency, timeout, isEditor, checkType }: Props) => {
  const { data: probes = [] } = useProbes();
  const {
    control,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const isTraceroute = checkType === CheckType.Traceroute;
  const { minFrequency, maxFrequency } = getFrequencyBounds(checkType);
  const { minTimeout, maxTimeout } = getTimeoutBounds(checkType);

  return (
    <div>
      <Subheader>Probe options</Subheader>

      <Controller<CheckFormValues>
        control={control}
        name="probes"
        rules={{ validate: validateProbes }}
        render={({ field }) => (
          <CheckProbes
            {...field}
            probes={field.value}
            availableProbes={probes}
            isEditor={isEditor}
            invalid={Boolean(errors.probes)}
            error={errors.probes?.message}
          />
        )}
      />
      <Field
        label="Frequency"
        description="How frequently the check should run."
        disabled={!isEditor || isTraceroute}
        invalid={Boolean(errors.frequency)}
        error={errors.frequency?.message}
      >
        {checkType === CheckType.Traceroute || checkType === CheckType.Scripted ? (
          // This is just a placeholder for now, the frequency for traceroute checks is hardcoded in the submit
          <Input value={120} prefix="Every" suffix="seconds" width={20} readOnly />
        ) : (
          <SliderInput
            validate={(value) => validateFrequency(value, maxFrequency)}
            name="frequency"
            min={minFrequency}
            max={maxFrequency}
          />
        )}
      </Field>
      <Field
        label="Timeout"
        description="Maximum execution time for a check"
        disabled={!isEditor || checkType === CheckType.Traceroute}
        invalid={Boolean(errors.timeout)}
        error={errors.timeout?.message}
      >
        {checkType === CheckType.Traceroute ? (
          // This is just a placeholder for now, the timeout for traceroute checks is hardcoded in the submit
          <Input value={30} prefix="Every" suffix="seconds" width={20} />
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
    </div>
  );
};
