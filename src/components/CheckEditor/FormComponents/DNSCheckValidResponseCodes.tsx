import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, MultiSelect } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { DNS_RESPONSE_CODES } from 'components/constants';

export const DNSCheckValidResponseCodes = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control } = useFormContext<CheckFormValues>();
  const id = 'validStatusCodes';

  return (
    <Field
      htmlFor={id}
      label="Valid response codes"
      description="List of valid response codes"
      disabled={!isEditor}
      data-fs-element="Valid response code select"
    >
      <Controller
        control={control}
        name="settings.dns.validRCodes"
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <MultiSelect
              {...rest}
              options={DNS_RESPONSE_CODES}
              disabled={!isEditor}
              inputId={id}
              onChange={(values) => onChange(values.map((v) => v.value))}
            />
          );
        }}
      />
    </Field>
  );
};
