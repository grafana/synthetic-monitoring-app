import React from 'react';
import { FieldError, FieldPath, useFormContext } from 'react-hook-form';
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
  const fieldError = get(errors, name) as FieldError | undefined;
  const errorMessage = fieldError?.message;

  return (
    <Field
      description="The body of the HTTP request used in probe."
      error={errorMessage}
      htmlFor={name}
      invalid={Boolean(errorMessage)}
      label="Request body"
    >
      <TextArea
        {...register(name)}
        aria-label={`Request body`}
        data-fs-element="Check request body textarea"
        disabled={disabled}
        id={name}
        rows={10}
      />
    </Field>
  );
};
