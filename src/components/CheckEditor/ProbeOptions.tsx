import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues, CheckType } from 'types';
import { hasRole } from 'utils';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';
import { useProbes } from 'data/useProbes';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';

import CheckProbes from './CheckProbes';

interface Props {
  checkType: CheckType;
}

function getFrequencyBounds(checkType: CheckType) {
  if (checkType === CheckType.Traceroute) {
    return {
      minFrequency: 60.0,
      maxFrequency: 240.0,
      defaultFrequency: 120.0,
    };
  }
  if (checkType === CheckType.MULTI_HTTP) {
    return {
      minFrequency: 60.0,
      maxFrequency: 120.0,
    };
  }
  return {
    minFrequency: 10.0,
    maxFrequency: 120.0,
  };
}

function getTimeoutBounds(checkType: CheckType) {
  if (checkType === CheckType.Traceroute) {
    return {
      minTimeout: 30.0,
      maxTimeout: 30.0,
    };
  }
  if (checkType === CheckType.MULTI_HTTP) {
    return {
      minTimeout: 1.0,
      maxTimeout: 30.0,
    };
  }
  if (checkType === CheckType.Scripted) {
    return {
      minTimeout: 5.0,
      maxTimeout: 30.0,
    };
  }
  return {
    minTimeout: 1.0,
    maxTimeout: 10.0,
  };
}

export const ProbeOptions = ({ checkType }: Props) => {
  const { data: probes = [] } = useProbes();
  const {
    control,
    formState: { errors },
    register,
    getValues,
    setValue,
  } = useFormContext<CheckFormValues>();
  const isTraceroute = checkType === CheckType.Traceroute;
  const { minFrequency, maxFrequency } = getFrequencyBounds(checkType);
  const { minTimeout, maxTimeout } = getTimeoutBounds(checkType);
  const isEditor = hasRole(OrgRole.Editor);
  const { ref: refFreq, ...fieldFrequency } = register('frequency', { valueAsNumber: true });
  const { ref: refTimeout, ...fieldTimeout } = register('timeout', { valueAsNumber: true });

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
            validate={(value) => validateFrequency(value, checkType)}
            prefixLabel={'Every'}
            suffixLabel={'seconds'}
            {...fieldFrequency}
            defaultValue={getValues('frequency')}
            onChange={(number) => {
              validateFrequency(number, checkType);
              setValue(`frequency`, number);
            }}
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
            validate={(value) => validateTimeout(value, checkType)}
            step={0.5}
            suffixLabel="seconds"
            prefixLabel="After"
            {...fieldTimeout}
            defaultValue={getValues('timeout')}
            onChange={(number) => {
              validateTimeout(number, checkType);
              setValue(`frequency`, number);
            }}
            max={maxTimeout}
            min={minTimeout}
          />
        )}
      </Field>
    </div>
  );
};
