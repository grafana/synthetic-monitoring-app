import React, { useId } from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';

interface RequestBodyContentEncodingProps {
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
}

export const RequestBodyContentEncoding = ({ disabled, name }: RequestBodyContentEncodingProps) => {
  const { register } = useFormContext<CheckFormValues>();
  const id = useId().replace(/:/g, '_');

  return (
    <Field label="Content encoding" description="Indicates the content encoding of the body" htmlFor={id}>
      <Input
        {...register(name)}
        id={id}
        data-fs-element={`Request body content encoding input ${id}`}
        disabled={disabled}
      />
    </Field>
  );
};
