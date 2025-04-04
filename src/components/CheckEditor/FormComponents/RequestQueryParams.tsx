import React from 'react';
import { FieldError, FieldPath, useFormContext } from 'react-hook-form';
import { Field } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';
import { interpolateErrorMessage } from 'components/CheckForm/utils';
import { NameValueInput, NameValueName } from 'components/NameValueInput/NameValueInput';

type RequestQueryParamsProps = {
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
};

export const RequestQueryParams = ({ disabled, name, ...rest }: RequestQueryParamsProps) => {
  const {
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const fieldError = get(errors, name) as FieldError | undefined;
  const errorMessage = fieldError?.message || fieldError?.root?.message;
  const label = `Query parameter`;

  return (
    <Field
      description={`The query parameters sent with the request. These parameters reduce cardinality when displaying URLs in dashboards. If you need higher cardinality, add your query parameters to the "Request target" field instead.`}
      error={interpolateErrorMessage(errorMessage, label)}
      invalid={Boolean(errorMessage)}
      label={`${label}s`}
    >
      <NameValueInput
        {...rest}
        data-fs-element="Query parameters"
        disabled={disabled}
        label={label}
        name={name as NameValueName}
      />
    </Field>
  );
};
