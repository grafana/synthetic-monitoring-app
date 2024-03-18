import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Select } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { METHOD_OPTIONS } from 'components/constants';

type RequestMethodInputProps = {
  'aria-label'?: string;
  name: string;
};

export const RequestMethodSelect = ({ 'aria-label': ariaLabel = `Request method`, name }: RequestMethodInputProps) => {
  const isEditor = hasRole(OrgRole.Editor);
  const { formState } = useFormContext<CheckFormValues>();
  const errMessage = get(formState.errors, name);

  return (
    <Field
      label="Request method"
      description="The HTTP method the probe will use"
      disabled={!isEditor}
      invalid={Boolean(errMessage)}
      error={typeof errMessage === `string` && errMessage}
    >
      <Controller
        render={({ field }) => {
          const { ref, ...rest } = field;
          return <Select {...rest} options={METHOD_OPTIONS} aria-label={ariaLabel} />;
        }}
        rules={{ required: true }}
        name={name}
      />
    </Field>
  );
};
