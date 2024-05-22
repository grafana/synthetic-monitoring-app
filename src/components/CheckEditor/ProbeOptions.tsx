import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues, CheckType, Probe } from 'types';
import { hasRole } from 'utils';
import { validateTimeout } from 'validation';
import { useProbes } from 'data/useProbes';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';

import CheckProbes from './CheckProbes';

interface Props {
  checkType: CheckType;
}

function getFrequencyBounds(checkType: CheckType) {
  const oneHour = 60 * 60;
  if (checkType === CheckType.Traceroute) {
    return {
      minFrequency: 120.0,
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

function getAvailableProbes(probes: Probe[], checkType: CheckType) {
  if (checkType === CheckType.Scripted) {
    return probes.filter((probe) => probe.capabilities.disableScriptedChecks === false);
  }
  return probes;
}

export const ProbeOptions = ({ checkType }: Props) => {
  const { data: probes = [] } = useProbes();
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<CheckFormValues>();
  const isTraceroute = checkType === CheckType.Traceroute;
  const { minFrequency, maxFrequency } = getFrequencyBounds(checkType);
  const { minTimeout, maxTimeout } = getTimeoutBounds(checkType);
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <div>
      <Subheader>Probe options</Subheader>

      <Controller<CheckFormValues>
        control={control}
        name="probes"
        render={({ field }) => (
          <CheckProbes
            {...field}
            probes={field.value}
            availableProbes={getAvailableProbes(probes, checkType)}
            isEditor={isEditor}
            invalid={Boolean(errors.probes)}
            error={errors.probes?.message}
          />
        )}
      />
      <Field
        label="Frequency"
        description="How frequently the check should run."
        disabled={!isEditor}
        invalid={Boolean(errors.frequency)}
        error={errors.frequency?.message}
      >
        <SliderInput name="frequency" min={minFrequency} max={maxFrequency} />
      </Field>
      <Field
        label="Timeout"
        description="Maximum execution time for a check"
        invalid={Boolean(errors.timeout)}
        error={errors.timeout?.message}
        htmlFor={`timeout`}
      >
        {isTraceroute ? (
          <Input
            {...register(`timeout`)}
            readOnly={!isEditor || isTraceroute}
            prefix="Every"
            suffix="seconds"
            width={18}
            id={`timeout`}
          />
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
