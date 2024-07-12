import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';

export const DNSCheckRecordServer = ({ disabled }: { disabled?: boolean }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-server-address';
  const fieldError = errors?.settings?.dns?.server?.message;

  return (
    <Field label="Server" disabled={disabled} htmlFor={id} invalid={Boolean(fieldError)} error={fieldError}>
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
