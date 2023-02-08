import React, { useState, useEffect, useContext } from 'react';
import { Field, Input } from '@grafana/ui';
import CheckProbes from './CheckProbes';
import { InstanceContext } from 'contexts/InstanceContext';
import { Probe, CheckType } from 'types';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';
import { useFormContext, Controller } from 'react-hook-form';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';

interface Props {
  isEditor: boolean;
  timeout: number;
  frequency: number;
  probes: number[];
  checkType: CheckType;
}

export const ProbeOptions = ({ frequency, timeout, isEditor, probes, checkType }: Props) => {
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { instance } = useContext(InstanceContext);
  const isTraceroute = checkType === CheckType.Traceroute;

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
        control={control}
        name="probes"
        rules={{ validate: validateProbes }}
        render={({ field }) => (
          <CheckProbes
            {...field}
            probes={probes}
            availableProbes={availableProbes}
            isEditor={isEditor}
            invalid={errors.probes}
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
        {checkType === CheckType.Traceroute ? (
          // This is just a placeholder for now, the frequency for traceroute checks is hardcoded in the submit
          <Input value={120} prefix="Every" suffix="seconds" width={20} />
        ) : (
          <SliderInput
            validate={(value) => validateFrequency(value, checkType)}
            name="frequency"
            prefixLabel={'Every'}
            suffixLabel={'seconds'}
            min={isTraceroute ? 60.0 : 10.0}
            max={isTraceroute ? 240.0 : 120.0}
            defaultValue={isTraceroute ? 120 : frequency / 1000}
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
            validate={(value) => validateTimeout(value, checkType)}
            defaultValue={isTraceroute ? 30 : timeout / 1000}
            max={isTraceroute ? 30.0 : 10.0}
            min={1.0}
            step={0.5}
            suffixLabel="seconds"
            prefixLabel="After"
          />
        )}
      </Field>
    </div>
  );
};
