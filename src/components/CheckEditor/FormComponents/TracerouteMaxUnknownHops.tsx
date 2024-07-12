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
      label="Max unknown hops"
      description="Maximimum number of hosts to traverse that give no response"
      invalid={Boolean(errors.settings?.traceroute?.maxUnknownHops)}
      error={errors.settings?.traceroute?.maxUnknownHops?.message}
      htmlFor={id}
    >
      <Input
        id={id}
        {...register('settings.traceroute.maxUnknownHops', {
          valueAsNumber: true,
        })}
        min={0}
        type="number"
        disabled={disabled}
        data-fs-element="Max unknown hops input"
      />
    </Field>
  );
};
