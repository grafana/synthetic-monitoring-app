import React from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../utils/form';
import { PasswordInput } from '../PasswordInput';
import { StyledField } from '../ui/StyledField';

interface FormHttpBearerTokenFieldProps {
  field: CheckFormFieldPath;
}

export function FormHttpBearerTokenField({ field }: FormHttpBearerTokenFieldProps) {
  const {
    register,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const inputId = useDOMId();

  return (
    <StyledField label="Token" required htmlFor={inputId} {...getFieldErrorProps(errors, field)}>
      <PasswordInput id={inputId} {...register(field)} disabled={disabled} />
    </StyledField>
  );
}
