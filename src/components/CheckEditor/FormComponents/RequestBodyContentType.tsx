import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

interface RequestBodyContentTypeProps {
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
}

export const RequestBodyContentType = ({ disabled, name }: RequestBodyContentTypeProps) => {
  const { register } = useFormContext<CheckFormValues>();
  const id = useDOMId();

  return (
    <Field label="Content type" description="Indicates the media type of the body" htmlFor={id}>
      <Input
        {...register(name)}
        data-fs-element={`Request body content type input ${id}`}
        disabled={disabled}
        id={id}
      />
    </Field>
  );
};
