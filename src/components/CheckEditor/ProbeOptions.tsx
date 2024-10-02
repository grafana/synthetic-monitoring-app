import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field } from '@grafana/ui';

import { CheckFormValues, CheckType, Probe } from 'types';
import { useProbes } from 'data/useProbes';
import { SliderInput } from 'components/SliderInput';

import { CheckProbes } from './CheckProbes';

interface ProbeOptionsProps {
  checkType: CheckType;
  disabled?: boolean;
}

export const ProbeOptions = ({ checkType, disabled }: ProbeOptionsProps) => {
  const { data: probes = [] } = useProbes();
  const {
    control,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const { minFrequency, maxFrequency } = getFrequencyBounds(checkType);

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
            disabled={disabled}
            invalid={Boolean(errors.probes)}
            error={errors.probes?.message}
          />
        )}
      />
      <Field
        label="Frequency"
        description="How frequently the check should run."
        invalid={Boolean(errors.frequency)}
        error={errors.frequency?.message}
      >
        <SliderInput disabled={disabled} name="frequency" min={minFrequency} max={maxFrequency} />
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
  if (checkType === CheckType.MULTI_HTTP || checkType === CheckType.Scripted || checkType === CheckType.Browser) {
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

  if (checkType === CheckType.Browser) {
    return probes.filter((probe) => probe.capabilities.disableBrowserChecks === false);
  }
  return probes;
}
