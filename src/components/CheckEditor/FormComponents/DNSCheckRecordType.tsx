import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Combobox, Field } from '@grafana/ui';

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
            <Combobox
              {...rest}
              disabled={disabled}
              options={DNS_RECORD_TYPES}
              id={id}
              onChange={({ value }) => onChange(value)}
            />
          );
        }}
      />
    </Field>
  );
};
