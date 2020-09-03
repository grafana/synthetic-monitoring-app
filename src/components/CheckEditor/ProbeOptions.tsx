import React, { FC, useState, useEffect, useContext, ChangeEvent } from 'react';
import { css } from 'emotion';
import { Field, Input } from '@grafana/ui';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';
import CheckProbes from './CheckProbes';
import { InstanceContext } from 'components/InstanceContext';
import { Probe } from 'types';
import { SliderInput } from 'components/SliderInput';

export interface OnChangeArgs {
  timeout: number;
  frequency: number;
  probes: number[];
}

const styles = {
  header: css`
    margin-bottom: 1rem;
  `,
};

interface Props {
  isEditor: boolean;
  timeout: number;
  frequency: number;
  probes: number[];
  onChange: (values: OnChangeArgs) => void;
}

export const ProbeOptions: FC<Props> = ({ frequency, timeout, isEditor, onChange, probes }) => {
  const [timeoutValue, setTimeoutValue] = useState(timeout);
  const [frequencyValue, setFrequencyValue] = useState(frequency);
  const [selectedProbes, setSelectedProbes] = useState(probes);
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const { instance } = useContext(InstanceContext);

  useEffect(() => {
    const fetchProbes = async () => {
      const probes = await instance?.api.listProbes();

      setAvailableProbes(probes ?? []);
    };

    fetchProbes();
  }, [instance]);

  useEffect(() => {
    onChange({
      timeout: timeoutValue,
      frequency: frequencyValue,
      probes: selectedProbes,
    });
  }, [timeoutValue, frequencyValue, selectedProbes, onChange]);

  return (
    <div>
      <h3 className={styles.header}>Probe Options</h3>
      <Field
        label="Probe Locations"
        description="Select up to 20 locations where this target will be checked from."
        disabled={!isEditor}
        invalid={!validateProbes(selectedProbes)}
      >
        <CheckProbes
          probes={selectedProbes}
          availableProbes={availableProbes}
          onUpdate={setSelectedProbes}
          isEditor={isEditor}
        />
      </Field>
      <Field
        label="Frequency"
        description="How frequently the check should run."
        disabled={!isEditor}
        invalid={!validateFrequency(frequencyValue)}
      >
        <SliderInput
          id="probe-options-frequency"
          value={frequencyValue / 1000}
          onChange={value => setFrequencyValue(value * 1000)}
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
        invalid={!validateTimeout(timeoutValue)}
      >
        <SliderInput
          id="probe-options-timeout"
          value={timeout / 1000}
          max={10}
          min={1}
          suffixLabel="seconds"
          separationLabel="every"
          onChange={value => setTimeoutValue(value * 1000)}
        />
      </Field>
    </div>
  );
};
