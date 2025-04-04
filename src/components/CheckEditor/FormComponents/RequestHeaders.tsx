import React from 'react';
import { FieldError, FieldPath, useFormContext } from 'react-hook-form';
import { Field } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';
import { interpolateErrorMessage } from 'components/CheckForm/utils';
import { NameValueInput, NameValueName } from 'components/NameValueInput/NameValueInput';

type RequestHeadersProps = {
  description: string;
  disabled?: boolean;
  label: string;
  name: FieldPath<CheckFormValues>;
  'data-fs-element'?: string;
};

export const RequestHeaders = ({ description, disabled, label, name, ...rest }: RequestHeadersProps) => {
  const {
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const fieldError = get(errors, name) as FieldError | undefined;
  const errorMessage = fieldError?.message || fieldError?.root?.message;

  return (
    <Field
      label={`${label}s`}
      description={description}
      error={interpolateErrorMessage(errorMessage, label)}
      invalid={Boolean(errorMessage)}
    >
      <NameValueInput name={name as NameValueName} disabled={disabled} label={label} {...rest} />
    </Field>
  );
};
