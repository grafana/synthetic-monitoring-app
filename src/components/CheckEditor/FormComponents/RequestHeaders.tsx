import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { parseErrorMessage } from 'components/CheckForm/utils';
import { NameValueInput, NameValueName } from 'components/NameValueInput/NameValueInput';

type RequestHeadersProps = {
  ariaLabelSuffix?: string;
  description: string;
  label: string;
  name: FieldPath<CheckFormValues>;
  'data-fs-element'?: string;
};

export const RequestHeaders = ({ ariaLabelSuffix, description, label, name, ...rest }: RequestHeadersProps) => {
  const isEditor = hasRole(OrgRole.Editor);
  const {
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const fieldError = get(errors, name);
  const errorMessage = fieldError?.message || fieldError?.root?.message;

  return (
    <Field
      label={`${label}s`}
      description={description}
      disabled={!isEditor}
      error={parseErrorMessage(errorMessage, label)}
      invalid={Boolean(errorMessage)}
    >
      <NameValueInput
        ariaLabelSuffix={ariaLabelSuffix}
        name={name as NameValueName}
        disabled={!isEditor}
        label={label}
        {...rest}
      />
    </Field>
  );
};
