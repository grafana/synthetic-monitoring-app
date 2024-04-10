import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';

export const HttpCheckProxyURL = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { register } = useFormContext<CheckFormValues>();
  const id = 'proxyUrl';

  return (
    <Field
      htmlFor={id}
      label="Proxy URL"
      description="HTTP proxy server to use to connect to the target"
      disabled={!isEditor}
    >
      <Input id={id} {...register('settings.http.proxyURL')} type="text" data-fs-element="Check proxy URL input" />
    </Field>
  );
};
