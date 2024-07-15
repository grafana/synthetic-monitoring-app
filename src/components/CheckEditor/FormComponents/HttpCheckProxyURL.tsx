import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';

interface HttpCheckProxyURLProps {
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
}

export const HttpCheckProxyURL = ({ disabled, name }: HttpCheckProxyURLProps) => {
  const { register } = useFormContext<CheckFormValues>();
  const id = 'proxyUrl';

  return (
    <Field htmlFor={id} label="Proxy URL" description="HTTP proxy server to use to connect to the target">
      <Input {...register(name)} data-fs-element="Check proxy URL input" disabled={disabled} id={id} type="text" />
    </Field>
  );
};
