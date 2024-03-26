import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesTraceroute } from 'types';
import { hasRole } from 'utils';

export const TracerouteMaxUnknownHops = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesTraceroute>();
  const id = 'traceroute-settings-max-unknown-hops';

  return (
    <Field
      label="Max unknown hops"
      description="Maximimum number of hosts to traverse that give no response"
      disabled={!isEditor}
      invalid={Boolean(errors.settings?.traceroute?.maxUnknownHops)}
      error={errors.settings?.traceroute?.maxUnknownHops?.message}
      htmlFor={id}
    >
      <Input
        id={id}
        {...register('settings.traceroute.maxUnknownHops', {
          min: { value: 0, message: `Must be greater than 0` },
          max: { value: 20, message: `Can be no more than 20` },
        })}
        min={0}
        type="number"
        disabled={!isEditor}
      />
    </Field>
  );
};
