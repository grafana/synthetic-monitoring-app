import React, { ComponentProps } from 'react';
import { useFormContext } from 'react-hook-form';
import { Switch } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';
import { useDOMId } from 'hooks/useDOMId';

import { getFieldErrorProps } from '../../../utils/form';
import { StyledField } from '../../ui/StyledField';

interface GenericSwitchFieldProps {
  field: CheckFormFieldPath;
  label: ComponentProps<typeof StyledField>['label'];
  description: ComponentProps<typeof StyledField>['description'];
}
export function GenericSwitchField({ field, label, description, ...rest }: GenericSwitchFieldProps) {
  const id = useDOMId();
  const {
    register,
    formState: { disabled, errors },
  } = useFormContext<CheckFormValues>();

  // Make sure we don't pass a `ReactNode` as `title` to the `Switch`
  const switchTitle = typeof label === 'string' ? label : undefined;

  return (
    <StyledField label={label} description={description} htmlFor={id} {...getFieldErrorProps(errors, field)}>
      <Switch {...register(field)} title={switchTitle} disabled={disabled} id={id} {...rest} />
    </StyledField>
  );
}
