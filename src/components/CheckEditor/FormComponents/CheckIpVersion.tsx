import React, { useId } from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { IP_OPTIONS } from 'components/constants';

type CheckIpVersionProps = {
  description: string;
  name: FieldPath<CheckFormValues>;
};

export const CheckIpVersion = ({ description, name }: CheckIpVersionProps) => {
  const { control } = useFormContext<CheckFormValues>();
  const isEditor = hasRole(OrgRole.Editor);
  const id = useId().replace(/:/g, '_');

  return (
    <Field
      label="IP version"
      description={description}
      disabled={!isEditor}
      htmlFor={id}
      data-fs-element="IP version select"
    >
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              options={IP_OPTIONS}
              inputId={id}
              value={rest.value}
              onChange={({ value }) => {
                onChange(value);
              }}
            />
          );
        }}
        name={name}
      />
    </Field>
  );
};
