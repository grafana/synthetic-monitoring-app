import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesTraceroute } from 'types';

export const TracerouteMaxUnknownHops = ({ disabled }: { disabled?: boolean }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesTraceroute>();
  const id = 'traceroute-settings-max-unknown-hops';

  return (
    <Field
      description="Maximimum number of hosts to traverse that give no response"
      error={errors.settings?.traceroute?.maxUnknownHops?.message}
      htmlFor={id}
      invalid={Boolean(errors.settings?.traceroute?.maxUnknownHops)}
      label="Max unknown hops"
    >
      <Input
        {...register('settings.traceroute.maxUnknownHops', {
          valueAsNumber: true,
        })}
        data-fs-element="Max unknown hops input"
        disabled={disabled}
        id={id}
        min={0}
        type="number"
      />
    </Field>
  );
};
