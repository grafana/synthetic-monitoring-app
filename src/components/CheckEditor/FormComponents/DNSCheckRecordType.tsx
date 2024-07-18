import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { DNS_RECORD_TYPES } from 'components/constants';

export const DNSCheckRecordType = ({ disabled }: { disabled?: boolean }) => {
  const id = 'dns-settings-record-type';
  const { control } = useFormContext<CheckFormValuesDns>();

  return (
    <Field label="Record type" htmlFor={id} data-fs-element="Record type select">
      <Controller
        control={control}
        name="settings.dns.recordType"
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              disabled={disabled}
              options={DNS_RECORD_TYPES}
              inputId={id}
              onChange={({ value }) => onChange(value)}
            />
          );
        }}
      />
    </Field>
  );
};
