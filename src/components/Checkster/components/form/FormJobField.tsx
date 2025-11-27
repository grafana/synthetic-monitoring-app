import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@grafana/ui';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues } from 'types';

import { StyledField } from '../ui/StyledField';

interface FormJobFieldProps {
  // Required for readability, even if it's the only option currently
  field: CheckFormFieldPath;
}

export function FormJobField({ field = 'job' }: FormJobFieldProps) {
  const {
    formState: { errors, disabled },
    register,
  } = useFormContext<CheckFormValues>();

  return (
    <StyledField
      label="Job name"
      description={'Name used for job label (in metrics it will appear as `job=X`)'}
      invalid={Boolean(errors.job)}
      error={errors.job?.message}
      required
    >
      <Input
        id="check-editor-job-input"
        data-testid={CHECKSTER_TEST_ID.form.inputs.job}
        {...register(field)}
        disabled={disabled}
        type="text"
        data-fs-element="Job name input"
      />
    </StyledField>
  );
}
