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
      description={'Name used for job label (in metrics it will appear as `jobName=X`)'}
      disabled={!isEditor}
      invalid={Boolean(formState.errors.job)}
      error={formState.errors.job?.message}
      required
    >
      <Input
        id="check-editor-job-input"
        {...register('job', {
          required: { value: true, message: 'Job name is required' },
          validate: validateJob,
        })}
        type="text"
        placeholder="jobName"
      />
    </Field>
  );
};

function validateJob(job: string): string | undefined {
  if (job.length > 128) {
    return 'Job name must be 128 characters or less';
  }

  return undefined;
}
