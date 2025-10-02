import React, { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';
import { TextArea } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { useCheckFormFieldPath } from '../../../hooks/useCheckFormFieldPath';
import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericTextareaFieldProps {
  label?: string;
  description?: string;
  required?: true;
  field: CheckFormFieldPath; // Adjust the type as necessary
  rows?: ComponentProps<typeof TextArea>['rows'];
  interpolationVariables?: Record<string, string>;
  fsDataElement?: string;
  placeholder?: string;
  className?: ComponentProps<typeof TextArea>['className'];
}

export function GenericTextareaField({
  label,
  description,
  field: _field,
  required,
  rows,
  placeholder,
  interpolationVariables,
  ...props
}: GenericTextareaFieldProps) {
  const id = useDOMId();
  // TODO: Work in progress
  const field = useCheckFormFieldPath(_field);

  const {
    register,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();

  return (
    <StyledField
      label={label}
      description={description}
      required={required}
      htmlFor={id}
      {...getFieldErrorProps(errors, field, interpolationVariables)}
    >
      <TextArea
        id={id}
        disabled={disabled}
        {...register(field as any)}
        aria-label={label}
        rows={rows}
        placeholder={placeholder}
        {...props}
      />
    </StyledField>
  );
}
