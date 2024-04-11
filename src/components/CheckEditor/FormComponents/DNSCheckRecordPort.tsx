import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { hasRole } from 'utils';

export const DNSCheckRecordPort = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-port';

  return (
    <Field label="Server" disabled={!isEditor} htmlFor={id}>
      <Input
        id="dns-settings-port"
        {...register('settings.dns.port')}
        type="number"
        placeholder="port"
        data-fs-element="DNS port input"
      />
    </Field>
  );
};
