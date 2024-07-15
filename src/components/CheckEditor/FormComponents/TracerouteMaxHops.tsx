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
      description="Maximum TTL for the trace"
      error={errors.settings?.traceroute?.maxHops?.message}
      htmlFor={id}
      invalid={Boolean(errors.settings?.traceroute?.maxHops)}
      label="Max hops"
    >
      <Input
        {...register('settings.traceroute.maxHops', { valueAsNumber: true })}
        data-fs-element="Max hops input"
        disabled={disabled}
        id={id}
        min={0}
        type="number"
      />
    </Field>
  );
};
