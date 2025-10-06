import React, { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../../utils/form';
import { InputSelect } from '../../InputSelect';
import { StyledField } from '../../ui/StyledField';

interface GenericInputSelectFieldProps {
  field: CheckFormFieldPath;
  label?: ComponentProps<typeof StyledField>['label'];
  description?: ComponentProps<typeof StyledField>['description'];
  options: ComponentProps<typeof InputSelect>['options'];
  placeholder?: ComponentProps<typeof InputSelect>['placeholder'];
  width?: number;
  className?: string;
}

export function GenericInputSelectField({
  field,
  label,
  placeholder,
  description,
  options = [],
  className,
  width = 20, // 0 means undefined TODO: Remove the default value
}: GenericInputSelectFieldProps) {
  const id = useDOMId();
  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  return (
    <StyledField label={label} description={description} htmlFor={id} {...getFieldErrorProps(errors, field)}>
      <Controller
        control={control}
        name={field}
        render={({ field }) => {
          return (
            <InputSelect
              id={id}
              width={width > 0 ? width : undefined}
              {...field}
              placeholder={placeholder}
              options={options}
              disabled={disabled}
              className={className}
            />
          );
        }}
      />
    </StyledField>
  );
}
