import React from 'react';
import { FieldPath } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';
import { validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';
import { NameValueInput, NameValueName } from 'components/NameValueInput/NameValueInput';

type RequestHeadersProps = {
  ariaLabelSuffix?: string;
  description: string;
  label: string;
  name: FieldPath<CheckFormValues>;
};

export const RequestHeaders = ({ ariaLabelSuffix, description, label, name }: RequestHeadersProps) => {
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <Field label={`${label}s`} description={description} disabled={!isEditor}>
      <NameValueInput
        ariaLabelSuffix={ariaLabelSuffix}
        name={name as NameValueName}
        disabled={!isEditor}
        label={label}
        validateName={validateHTTPHeaderName}
        validateValue={validateHTTPHeaderValue}
      />
    </Field>
  );
};
