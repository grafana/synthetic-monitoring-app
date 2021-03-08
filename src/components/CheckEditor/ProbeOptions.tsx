import React, { useState, useEffect, useContext } from 'react';
import { Field } from '@grafana/ui';
import CheckProbes from './CheckProbes';
import { InstanceContext } from 'components/InstanceContext';
import { Probe } from 'types';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';
import { useFormContext, Controller } from 'react-hook-form';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';

interface Props {
  isEditor: boolean;
  timeout: number;
  frequency: number;
  probes: number[];
}

export const ProbeOptions = ({ frequency, timeout, isEditor, probes }: Props) => {
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const { control, errors } = useFormContext();
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    const abortController = new AbortController();
    const fetchProbes = async () => {
      const probes = await instance.api?.listProbes();
      if (!abortController.signal.aborted) {
        setAvailableProbes(probes ?? []);
      }
    };

    fetchProbes();
    return () => abortController.abort();
  }, [instance]);

  return (
    <div>
      <Subheader>Probe options</Subheader>

      <Controller
        as={CheckProbes}
        control={control}
        name="probes"
        valueName="probes"
        rules={{ validate: validateProbes }}
        probes={probes}
        availableProbes={availableProbes}
        isEditor={isEditor}
        invalid={errors.probes}
        error={errors.probes?.message}
      />
      <Field
        label="Frequency"
        description="How frequently the check should run."
        disabled={!isEditor}
        invalid={Boolean(errors.frequency)}
        error={errors.frequency?.message}
      >
        <SliderInput
          rules={{ validate: validateFrequency }}
          name="frequency"
          prefixLabel={'Every'}
          suffixLabel={'seconds'}
          min={10.0}
          max={120.0}
          defaultValue={frequency / 1000}
        />
      </Field>
      <Field
        label="Timeout"
        description="Maximum execution time for a check"
        disabled={!isEditor}
        invalid={Boolean(errors.timeout)}
        error={errors.timeout?.message}
      >
        <SliderInput
          name="timeout"
          rules={{ validate: validateTimeout }}
          defaultValue={timeout / 1000}
          max={10.0}
          min={1.0}
          step={0.5}
          suffixLabel="seconds"
          prefixLabel="After"
        />
      </Field>
    </div>
  );
};
