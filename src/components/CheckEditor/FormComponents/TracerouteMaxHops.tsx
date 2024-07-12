import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesTraceroute } from 'types';

export const TracerouteMaxHops = ({ disabled }: { disabled?: boolean }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesTraceroute>();
  const id = 'traceroute-settings-max-hops';

  return (
    <Field
      label="Max hops"
      description="Maximum TTL for the trace"
      invalid={Boolean(errors.settings?.traceroute?.maxHops)}
      error={errors.settings?.traceroute?.maxHops?.message}
      htmlFor={id}
    >
      <Input
        id={id}
        {...register('settings.traceroute.maxHops', { valueAsNumber: true })}
        min={0}
        type="number"
        disabled={disabled}
        data-fs-element="Max hops input"
      />
    </Field>
  );
};
