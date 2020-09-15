import React, { FC, useState, useEffect, useContext } from 'react';
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

export const ProbeOptions: FC<Props> = ({ frequency, timeout, isEditor, probes }) => {
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const { control, errors } = useFormContext();
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    const fetchProbes = async () => {
      const probes = await instance?.api.listProbes();

      setAvailableProbes(probes ?? []);
    };

    fetchProbes();
  }, [instance]);

  return (
    <div>
      <Subheader>Probe Options</Subheader>

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
        <Controller
          id="probe-options-frequency"
          name="frequency"
          rules={{ validate: validateFrequency }}
          control={control}
          value={frequency}
          defaultValue={frequency / 1000}
          as={SliderInput}
          min={10}
          max={120}
          separationLabel="every"
          suffixLabel="seconds"
        />
      </Field>
      <Field
        label="Timeout"
        description="Maximum execution time for a check"
        disabled={!isEditor}
        invalid={Boolean(errors.timeout)}
        error={errors.timeout?.message}
      >
        <Controller
          id="probe-options-timeout"
          name="timeout"
          rules={{ validate: validateTimeout }}
          value={timeout}
          defaultValue={timeout / 1000}
          as={SliderInput}
          max={10}
          min={1}
          suffixLabel="seconds"
          separationLabel="after"
        />
      </Field>
    </div>
  );
};
