import React, { useContext, useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckType, Probe } from 'types';
import { validateFrequency, validateProbes, validateTimeout } from 'validation';
import { InstanceContext } from 'contexts/InstanceContext';
import { SliderInput } from 'components/SliderInput';
import { Subheader } from 'components/Subheader';

import CheckProbes from './CheckProbes';

interface Props {
  isEditor: boolean;
  timeout: number;
  frequency: number;
  checkType: CheckType;
}

function getFrequencyBounds(checkType: CheckType) {
  if (checkType === CheckType.Traceroute) {
    return {
      minFrequency: 60.0,
      maxFrequency: 240.0,
      defaultFrequency: 120.0,
    };
  }
  if (checkType === CheckType.MULTI_HTTP) {
    return {
      minFrequency: 60.0,
      maxFrequency: 120.0,
    };
  }
  return {
    minFrequency: 10.0,
    maxFrequency: 120.0,
  };
}

function getTimeoutBounds(checkType: CheckType) {
  if (checkType === CheckType.Traceroute) {
    return {
      minTimeout: 30.0,
      maxTimeout: 30.0,
      defaultTimeout: 30.0,
    };
  }
  if (checkType === CheckType.MULTI_HTTP) {
    return {
      minTimeout: 1.0,
      maxTimeout: 30.0,
    };
  }
  if (checkType === CheckType.K6) {
    return {
      minTimeout: 5.0,
      maxTimeout: 30.0,
      defaultTimeout: 10.0,
    };
  }
  return {
    minTimeout: 1.0,
    maxTimeout: 10.0,
  };
}

export const ProbeOptions = ({ frequency, timeout, isEditor, checkType }: Props) => {
  const [availableProbes, setAvailableProbes] = useState<Probe[]>([]);
  const {
    control,
    formState: { errors },
  } = useFormContext();
  const { instance } = useContext(InstanceContext);
  const isTraceroute = checkType === CheckType.Traceroute;

  const { minFrequency, maxFrequency, defaultFrequency } = getFrequencyBounds(checkType);
  const { minTimeout, maxTimeout, defaultTimeout } = getTimeoutBounds(checkType);

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
            probes={field.value}
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
        {checkType === CheckType.Traceroute || checkType === CheckType.K6 ? (
          // This is just a placeholder for now, the frequency for traceroute checks is hardcoded in the submit
          <Input value={120} prefix="Every" suffix="seconds" width={20} readOnly />
        ) : (
          <SliderInput
            validate={(value) => validateFrequency(value, checkType)}
            name="frequency"
            prefixLabel={'Every'}
            suffixLabel={'seconds'}
            min={minFrequency}
            max={maxFrequency}
            defaultValue={defaultFrequency ?? frequency / 1000}
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
            defaultValue={defaultTimeout ?? timeout / 1000}
            max={maxTimeout}
            min={minTimeout}
            step={0.5}
            suffixLabel="seconds"
            prefixLabel="After"
          />
        )}
      </Field>
    </div>
  );
};
