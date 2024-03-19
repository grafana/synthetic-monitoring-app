import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesTraceroute } from 'types';
import { hasRole } from 'utils';

export const TracerouteMaxHops = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesTraceroute>();
  const id = 'traceroute-settings-max-hops';

  return (
    <Field
      label="Max hops"
      description="Maximum TTL for the trace"
      disabled={!isEditor}
      invalid={Boolean(errors.settings?.traceroute?.maxHops)}
      error={errors.settings?.traceroute?.maxHops?.message}
      htmlFor={id}
    >
      <Input
        id={id}
        {...register('settings.traceroute.maxHops', {
          min: { value: 0, message: `Must be greater than 0` },
          max: { value: 64, message: `Can be no more than 64` },
        })}
        min={0}
        type="number"
        disabled={!isEditor}
      />
    </Field>
  );
};
