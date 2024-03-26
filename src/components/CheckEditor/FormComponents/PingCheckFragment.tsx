import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Switch } from '@grafana/ui';

import { CheckFormValuesPing } from 'types';
import { hasRole } from 'utils';

export const PingCheckFragment = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValuesPing>();
  const id = 'ping-settings-dont-fragment';

  return (
    <Field
      label="Don't fragment"
      description="Set the DF-bit in the IP-header. Only works with ipV4"
      disabled={!isEditor}
      htmlFor={id}
    >
      <Switch id={id} {...register('settings.ping.dontFragment')} disabled={!isEditor} />
    </Field>
  );
};
