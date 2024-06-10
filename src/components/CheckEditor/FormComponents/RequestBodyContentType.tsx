import React, { useId } from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';

interface RequestBodyContentTypeProps {
  name: FieldPath<CheckFormValues>;
}

export const RequestBodyContentType = ({ name }: RequestBodyContentTypeProps) => {
  const { register } = useFormContext<CheckFormValues>();
  const id = useId().replace(/:/g, '_');

  return (
    <Field label="Content type" description="Indicates the media type of the body" htmlFor={id}>
      <Input {...register(name)} id={id} data-fs-element={`Request body content type input ${id}`} />
    </Field>
  );
};
