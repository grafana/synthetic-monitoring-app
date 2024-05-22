import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { hasRole } from 'utils';

export const DNSCheckRecordServer = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-server-address';
  const fieldError = errors?.settings?.dns?.server?.message;

  return (
    <Field label="Server" disabled={!isEditor} htmlFor={id} invalid={Boolean(fieldError)} error={fieldError}>
      <Input
        id={id}
        {...register('settings.dns.server')}
        type="text"
        placeholder="server"
        data-fs-element="DNS server input"
      />
    </Field>
  );
};
