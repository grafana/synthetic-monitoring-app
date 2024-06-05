import React from 'react';
import { useFormContext } from 'react-hook-form';
import { OrgRole } from '@grafana/data';
import { Field, Input } from '@grafana/ui';

import { CheckFormValues } from 'types';
import { hasRole } from 'utils';

export const CheckJobName = () => {
  const isEditor = hasRole(OrgRole.Editor);
  const { formState, register } = useFormContext<CheckFormValues>();

  return (
    <Field
      label="Job name"
      description={'Name used for job label (in metrics it will appear as `job=X`)'}
      disabled={!isEditor}
      invalid={Boolean(formState.errors.job)}
      error={formState.errors.job?.message}
      required
    >
      <Input
        id="check-editor-job-input"
        {...register('job')}
        type="text"
        placeholder="jobName"
        data-fs-element="Job name input"
      />
    </Field>
  );
};
