import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const HttpCheckFollowRedirects = ({ name }: { name: FieldPath<CheckFormValues> }) => {
  const { register, formState } = useFormContext<CheckFormValues>();

  return (
    <HorizontalCheckboxField
      {...register(name)}
      data-fs-element="Follow redirects checkbox"
      disabled={formState.disabled}
      id="http-settings-followRedirects"
      label="Follow redirects"
    />
  );
};
