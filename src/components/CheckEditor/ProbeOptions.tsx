import React, { FC, useState, useEffect, useContext, ChangeEvent } from 'react';
import { css } from 'emotion';
import { Field, Input } from '@grafana/ui';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';
import CheckProbes from './CheckProbes';
import { InstanceContext } from 'components/InstanceContext';
import { Probe } from 'types';

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
        <Input
          label="Frequency"
          type="number"
          step={10}
          value={frequency / 1000}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFrequencyValue(e.target.valueAsNumber * 1000)}
          suffix="seconds"
          max={120}
          min={10}
          width={30}
        />
      </Field>
      <Field
        label="Timeout"
        description="Maximum execution time for a check"
        disabled={!isEditor}
        invalid={!validateTimeout(timeout)}
      >
        <Input
          label="Timeout"
          type="number"
          step={0.1}
          value={timeout / 1000}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTimeoutValue(e.target.valueAsNumber * 1000)}
          suffix="seconds"
          max={10}
          min={1}
          width={30}
        />
      </Field>
    </div>
  );
};
