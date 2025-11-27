import React, { ComponentProps } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { SelectableValue } from '@grafana/data';
import { MultiCombobox } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericMultiSelectFieldProps {
  field: CheckFormFieldPath;
  label: ComponentProps<typeof StyledField>['label'];
  description: ComponentProps<typeof StyledField>['description'];
  options: ComponentProps<typeof MultiCombobox>['options'];
  placeholder: ComponentProps<typeof MultiCombobox>['placeholder'];
  'data-testid'?: string;
}

export function GenericMultiSelectField({
  'data-testid': dataTestId,
  description,
  field,
  label,
  options,
  placeholder,
}: GenericMultiSelectFieldProps) {
  const id = useDOMId();
  const {
    control,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();

  const {
    field: { onChange, ref, ...rest },
  } = useController({ control, name: field as any });

  const handleOnChange = (selected: SelectableValue[]) => {
    onChange(selected.map((item) => item.value));
  };

  return (
    <StyledField label={label} description={description} htmlFor={id} {...getFieldErrorProps(errors, field)}>
      <MultiCombobox
        {...rest}
        data-testid={dataTestId}
        disabled={disabled}
        id={id}
        onChange={handleOnChange}
        options={options}
        placeholder={placeholder}
      />
    </StyledField>
  );
}
