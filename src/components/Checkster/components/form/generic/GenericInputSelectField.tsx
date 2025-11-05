import React, { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { Combobox } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericInputSelectFieldProps {
  field: CheckFormFieldPath;
  label?: ComponentProps<typeof StyledField>['label'];
  description?: ComponentProps<typeof StyledField>['description'];
  options: ComponentProps<typeof Combobox>['options'];
  placeholder?: ComponentProps<typeof Combobox>['placeholder'];
  width?: number;
  className?: string;
  'aria-label'?: string;
}

export function GenericInputSelectField({
  field,
  label,
  placeholder,
  description,
  options = [],
  className,
  ...rest // ideally, only used for aria attributes
}: GenericInputSelectFieldProps) {
  const {
    watch,
    setValue,
    register,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();
  const { onChange: _onChange, onBlur: _onBlur, ref, ...fieldProps } = register(field);

  const inputValue = watch(field) as any;

  const handleOnChange = ({ value }: SelectableValue) => {
    setValue(field, value, { shouldDirty: true });
  };

  // Using aria-label when there is no visible label
  const labelId = !label ? `${fieldProps.name}--label` : undefined;

  return (
    <StyledField
      id={labelId}
      label={label}
      description={description}
      htmlFor={fieldProps.name}
      {...getFieldErrorProps(errors, field)}
      aria-label={'aria-label' in rest ? rest['aria-label'] : undefined}
    >
      <Combobox
        value={inputValue}
        id={fieldProps.name}
        {...fieldProps}
        onChange={handleOnChange}
        disabled={disabled}
        options={options}
        aria-labelledby={labelId}
        {...rest}
      />
    </StyledField>
  );
}
