import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { hasRole } from 'utils';
import { DNS_PROTOCOLS } from 'components/constants';

export const DNSCheckRecordProtocol = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-protocol';

  return (
    <Field label="Protocol" disabled={!isEditor} htmlFor={id} data-fs-element="DNS protocol select">
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return <Select {...rest} options={DNS_PROTOCOLS} inputId={id} onChange={({ value }) => onChange(value)} />;
        }}
        name="settings.dns.protocol"
      />
    </Field>
  );
};
