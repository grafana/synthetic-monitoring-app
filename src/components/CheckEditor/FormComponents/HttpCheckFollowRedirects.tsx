import React from 'react';
import { FieldPath, useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { useCheckFormContext } from 'components/CheckForm/CheckFormContext/CheckFormContext';
import { HorizontalCheckboxField } from 'components/HorizonalCheckboxField';

export const HttpCheckFollowRedirects = ({ name }: { name: FieldPath<CheckFormValues> }) => {
  const { register } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();

  return (
    <HorizontalCheckboxField
      {...register(name)}
      data-fs-element="Follow redirects checkbox"
      disabled={isFormDisabled}
      id="http-settings-followRedirects"
      label="Follow redirects"
    />
  );
};
