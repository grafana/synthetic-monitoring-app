import React, { ComponentProps } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { RadioButtonGroup } from '@grafana/ui';

import { GenericFieldProps } from '../../../types';
import { CheckFormValues } from 'types';

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
  const {
    control,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValues>();

  const {
    field: { ref, ...fieldProps },
  } = useController({ control, name: field });

  return (
    <StyledField label={label} description={description} {...getFieldErrorProps(errors, field)} emulate>
      <RadioButtonGroup
        aria-label={typeof label === 'string' ? label : undefined}
        id={field}
        {...fieldProps}
        options={options}
        disabled={disabled}
      />
    </StyledField>
  );
}
