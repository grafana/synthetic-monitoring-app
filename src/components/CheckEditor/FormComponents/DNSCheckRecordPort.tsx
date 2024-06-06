import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { hasRole } from 'utils';

export const DNSCheckRecordPort = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-port';
  const fieldError = errors?.settings?.dns?.port?.message;

  return (
    <Field label="Port" disabled={!isEditor} htmlFor={id} invalid={Boolean(fieldError)} error={fieldError}>
      <Input
        id="dns-settings-port"
        {...register('settings.dns.port', { valueAsNumber: true })}
        type="number"
        placeholder="port"
        data-fs-element="DNS port input"
      />
    </Field>
  );
};
