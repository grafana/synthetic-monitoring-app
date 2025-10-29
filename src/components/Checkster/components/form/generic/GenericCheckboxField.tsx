import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Checkbox, Stack } from '@grafana/ui';

import { CheckFormFieldPath } from '../../../types';
import { CheckFormValues } from 'types';

interface GenericCheckboxFieldProps {
  label?: string;
  field: CheckFormFieldPath;
  description?: string;
  'aria-label'?: string;
}

export function GenericCheckboxField({ field, label, description, ...rest }: GenericCheckboxFieldProps) {
  const {
    register,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();

  return (
    <Stack>
      <Checkbox label={label} description={description} {...register(field)} disabled={disabled} {...rest} />
    </Stack>
  );
}
