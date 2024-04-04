import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, TextArea } from '@grafana/ui';
import { get } from 'lodash';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';

type RequestBodyTextAreaProps = {
  name: FieldPath<CheckFormValues>;
};

export const RequestBodyTextArea = ({ name }: RequestBodyTextAreaProps) => {
  const isEditor = hasRole(OrgRole.Editor);
  const {
    register,
    formState: { errors },
  } = useFormContext<CheckFormValues>();
  const error = get(errors, name);

  return (
    <Field
      label="Request body"
      description="The body of the HTTP request used in probe."
      disabled={!isEditor}
      invalid={Boolean(error)}
      error={error?.message}
      htmlFor={name}
    >
      <TextArea
        id={name}
        {...register(name)}
        rows={2}
        disabled={!isEditor}
        data-fs-element="Check request body textarea"
      />
    </Field>
  );
};
