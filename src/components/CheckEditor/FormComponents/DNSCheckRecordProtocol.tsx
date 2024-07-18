import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, Select } from '@grafana/ui';

import { CheckFormValuesDns } from 'types';
import { DNS_PROTOCOLS } from 'components/constants';

export const DNSCheckRecordProtocol = ({ disabled }: { disabled?: boolean }) => {
  const { control } = useFormContext<CheckFormValuesDns>();
  const id = 'dns-settings-protocol';

  return (
    <Field label="Protocol" htmlFor={id} data-fs-element="DNS protocol select">
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              disabled={disabled}
              options={DNS_PROTOCOLS}
              inputId={id}
              onChange={({ value }) => onChange(value)}
            />
          );
        }}
        name="settings.dns.protocol"
      />
    </Field>
  );
};
