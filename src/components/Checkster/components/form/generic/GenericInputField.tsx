import React, { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericInputFieldFormInputFieldProps {
  label?: ComponentProps<typeof StyledField>['label'];
  description?: ComponentProps<typeof StyledField>['description'];
  required?: true;
  field: CheckFormFieldPath; // Adjust the type as necessary
  placeholder?: ComponentProps<typeof Input>['placeholder'];
  type?: ComponentProps<typeof Input>['type'];
  interpolationVariables?: Record<string, string>;
}

export function GenericInputField({
  label,
  description,
  placeholder,
  field,
  required,
  type = 'text',
  interpolationVariables,
}: GenericInputFieldFormInputFieldProps) {
  const {
    register,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();

  return (
    <StyledField
      label={label}
      description={description}
      required={required}
      {...getFieldErrorProps(errors, field, interpolationVariables)}
    >
      <Input
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        {...register(field as any, { valueAsNumber: type === 'number' })}
      />
    </StyledField>
  );
}
