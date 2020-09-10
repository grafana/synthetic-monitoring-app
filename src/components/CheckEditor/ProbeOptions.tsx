import React, { FC, useState, useEffect, useContext } from 'react';
import { Field } from '@grafana/ui';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';
import CheckProbes from './CheckProbes';
import { InstanceContext } from 'components/InstanceContext';
import { Probe } from 'types';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';
import { useFormContext, Controller } from 'react-hook-form';

interface Props {
  isEditor: boolean;
  timeout: number;
  frequency: number;
  probes: number[];
}

export const ProbeOptions: FC<Props> = ({ frequency, timeout, isEditor, probes }) => {
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const { control } = useFormContext();
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
      <Field
        label="Probe Locations"
        description="Select up to 20 locations where this target will be checked from."
        disabled={!isEditor}
        // invalid={!validateProbes(selectedProbes)}
      >
        <Controller
          as={CheckProbes}
          control={control}
          name="probes"
          valueName="probes"
          probes={probes}
          availableProbes={availableProbes}
          isEditor={isEditor}
        />
      </Field>
      <Field
        label="Frequency"
        description="How frequently the check should run."
        disabled={!isEditor}
        // invalid={!validateFrequency(frequencyValue)}
      >
        <Controller
          id="probe-options-frequency"
          name="frequency"
          control={control}
          value={frequency}
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
        // invalid={!validateTimeout(timeoutValue)}
      >
        <Controller
          id="probe-options-timeout"
          name="timeout"
          value={timeout}
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
