import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { Field, TextArea } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';

type RequestBodyTextAreaProps = {
  disabled?: boolean;
  name: FieldPath<CheckFormValues>;
};

export const RequestBodyTextArea = ({ disabled, name }: RequestBodyTextAreaProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const error = get(errors, name);

  return (
    <Field
      label="Request body"
      description="The body of the HTTP request used in probe."
      disabled={disabled}
      invalid={Boolean(error)}
      error={error?.message}
      htmlFor={name}
    >
      <TextArea
        aria-label={`Request body`}
        id={name}
        {...register(name)}
        rows={10}
        disabled={disabled}
        data-fs-element="Check request body textarea"
      />
    </Field>
  );
};
