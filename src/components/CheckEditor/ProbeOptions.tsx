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
}

export const ProbeOptions = ({ frequency, timeout, isEditor, probes }: Props) => {
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const {
    control,
    watch,
    formState: { errors },
    register,
  } = useFormContext();
  const { instance } = useContext(InstanceContext);

  const checkType = watch('checkType').value;

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
        disabled={!isEditor || checkType === CheckType.Traceroute}
        invalid={Boolean(errors.frequency)}
        error={errors.frequency?.message}
      >
        {checkType === CheckType.Traceroute ? (
          <Input {...register('frequency')} value={120} prefix="Every" suffix="seconds" width={20} />
        ) : (
          <SliderInput
            validate={(value) => validateFrequency(value, checkType)}
            name="frequency"
            prefixLabel={'Every'}
            suffixLabel={'seconds'}
            min={checkType === CheckType.Traceroute ? 60.0 : 10.0}
            max={checkType === CheckType.Traceroute ? 240 : 120.0}
            defaultValue={checkType === CheckType.Traceroute ? 120 : frequency / 1000}
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
          <Input {...register('timeout')} value={30} prefix="Every" suffix="seconds" width={20} />
        ) : (
          <SliderInput
            name="timeout"
            validate={(value) => validateTimeout(value, checkType)}
            defaultValue={checkType === CheckType.Traceroute ? 30 : timeout / 1000}
            max={checkType === CheckType.Traceroute ? 30.0 : 10.0}
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
