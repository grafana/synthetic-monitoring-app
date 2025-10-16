import React, { ComponentProps } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { RadioButtonGroup } from '@grafana/ui';

import { GenericFieldProps } from '../../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericRadioButtonGroupFieldProps extends GenericFieldProps {
  options: ComponentProps<typeof RadioButtonGroup>['options'];
}

export function GenericRadioButtonGroupField({
  field,
  label,
  description,
  options,
}: GenericRadioButtonGroupFieldProps) {
  const id = useDOMId();

  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  return (
    <StyledField label={label} description={description} htmlFor={id} {...getFieldErrorProps(errors, field)}>
      <Controller
        name={field}
        control={control}
        render={({ field: fieldProps }) => {
          return <RadioButtonGroup id={id} {...fieldProps} options={options} disabled={disabled} />;
        }}
      />
    </StyledField>
  );
}
