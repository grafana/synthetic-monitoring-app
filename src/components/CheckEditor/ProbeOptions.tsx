import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field } from '@grafana/ui';

import { CheckFormValues, CheckType, Probe } from 'types';
import { hasRole } from 'utils';
import { useProbes } from 'data/useProbes';
import { SliderInput } from 'components/SliderInput';

import { CheckProbes } from './CheckProbes';

interface Props {
  checkType: CheckType;
}

export const ProbeOptions = ({ checkType }: Props) => {
  const { data: probes = [] } = useProbes();
  const {
    control,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const { minFrequency, maxFrequency } = getFrequencyBounds(checkType);
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <div>
      <Controller
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
    </div>
  );
};

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

function getAvailableProbes(probes: Probe[], checkType: CheckType) {
  if (checkType === CheckType.Scripted) {
    return probes.filter((probe) => probe.capabilities.disableScriptedChecks === false);
  }
  return probes;
}
