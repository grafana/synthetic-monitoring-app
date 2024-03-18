import React from 'react';
import { OrgRole } from '@grafana/data';
import { Field } from '@grafana/ui';

import { hasRole } from 'utils';
import { validateHTTPHeaderName, validateHTTPHeaderValue } from 'validation';
import { NameValueInput } from 'components/NameValueInput';

type RequestHeadersProps = {
  description: string;
  label: string;
  name: any;
};

export const RequestHeaders = ({ description, label, name }: RequestHeadersProps) => {
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <Field label={`${label}s`} description={description} disabled={!isEditor}>
      <NameValueInput
        name={name}
        disabled={!isEditor}
        label={label}
        validateName={validateHTTPHeaderName}
        validateValue={validateHTTPHeaderValue}
      />
    </Field>
  );
};
