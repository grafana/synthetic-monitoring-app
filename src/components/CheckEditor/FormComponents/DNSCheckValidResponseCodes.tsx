import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Field, MultiSelect } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { DNS_RESPONSE_CODES } from 'components/constants';

export const DNSCheckValidResponseCodes = () => {
  const { control } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();
  const id = 'validStatusCodes';

  return (
    <Field
      htmlFor={id}
      label="Valid response codes"
      description="List of valid response codes"
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
              disabled={isFormDisabled}
              inputId={id}
              onChange={(values) => onChange(values.map((v) => v.value))}
            />
          );
        }}
      />
    </Field>
  );
};
