import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';

export const DNSCheckRecordPort = ({ disabled }: { disabled?: boolean }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-port';
  const fieldError = errors?.settings?.dns?.port?.message;

  return (
    <Field label="Port" htmlFor={id} invalid={Boolean(fieldError)} error={fieldError}>
      <Input
        {...register('settings.dns.port', { valueAsNumber: true })}
        data-fs-element="DNS port input"
        disabled={disabled}
        id="dns-settings-port"
        placeholder="port"
        type="number"
      />
    </Field>
  );
};
