import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { hasRole } from 'utils';
import { DNS_RECORD_TYPES } from 'components/constants';

export const DNSCheckRecordType = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const id = 'dns-settings-record-type';
  const { control } = useFormContext<CheckFormValuesDns>();

  return (
    <Field label="Record type" disabled={!isEditor} htmlFor={id} data-fs-element="Record type select">
      <Controller
        control={control}
        name="settings.dns.recordType"
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return <Select {...rest} options={DNS_RECORD_TYPES} inputId={id} onChange={({ value }) => onChange(value)} />;
        }}
      />
    </Field>
  );
};
