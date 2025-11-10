import React, { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { MultiSelect } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericMultiSelectFieldProps {
  field: CheckFormFieldPath;
  label: ComponentProps<typeof StyledField>['label'];
  description: ComponentProps<typeof StyledField>['description'];
  options: ComponentProps<typeof MultiSelect>['options'];
  placeholder: ComponentProps<typeof MultiSelect>['placeholder'];
}

export function GenericMultiSelectField({
  field,
  label,
  description,
  options,
  placeholder,
}: GenericMultiSelectFieldProps) {
  const id = useDOMId();
  const {
    control,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();

  return (
    <StyledField label={label} description={description} htmlFor={id} {...getFieldErrorProps(errors, field)}>
      <Controller
        control={control}
        name={field as any}
        render={({ field }) => {
          const { ref, onChange, ...rest } = field;
          const handleOnChange = (selected: SelectableValue[]) => {
            onChange(selected.map((item) => item.value));
          };

          return (
            <MultiSelect
              {...rest}
              placeholder={placeholder}
              options={options}
              disabled={disabled}
              inputId={id}
              onChange={handleOnChange}
            />
          );
        }}
      ></Controller>
    </StyledField>
  );
}
