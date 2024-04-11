import React from 'react';
import { Controller, FieldPath, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { METHOD_OPTIONS } from 'components/constants';

type RequestMethodInputProps = {
  'aria-label'?: string;
  name: FieldPath<CheckFormValues>;
};

export const RequestMethodSelect = ({ 'aria-label': ariaLabel = `Request method`, name }: RequestMethodInputProps) => {
  const isEditor = hasRole(OrgRole.Editor);
  const { control, formState } = useFormContext<CheckFormValues>();
  const errMessage = get(formState.errors, name);

  return (
    <Field
      label="Request method"
      description="The HTTP method the probe will use"
      disabled={!isEditor}
      invalid={Boolean(errMessage)}
      error={typeof errMessage === `string` && errMessage}
      data-fs-element="Check request method select"
    >
      <Controller
        control={control}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Select
              {...rest}
              options={METHOD_OPTIONS}
              aria-label={ariaLabel}
              onChange={({ value }) => onChange(value)}
            />
          );
        }}
        rules={{ required: true }}
        name={name}
      />
    </Field>
  );
};
