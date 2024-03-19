import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { hasRole } from 'utils';

export const DNSCheckRecordServer = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-server-address';

  return (
    <Field label="Server" disabled={!isEditor} htmlFor={id}>
      <Input id={id} {...register('settings.dns.server')} type="text" placeholder="server" />
    </Field>
  );
};
