import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Field, Input, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

export const CheckJobName = () => {
  const styles = useStyles2(getStyles);
  const { formState, register } = useFormContext<CheckFormValues>();

  return (
    <Field
      className={styles.field}
      label="Job name"
      description={'Name used for job label (in metrics it will appear as `job=X`)'}
      invalid={Boolean(formState.errors.job)}
      error={formState.errors.job?.message}
      required
    >
      <Input
        id="check-editor-job-input"
        {...register('job')}
        disabled={formState.disabled}
        type="text"
        data-fs-element="Job name input"
      />
    </Field>
  );
};

const getStyles = () => ({
  field: css({
    margin: 0,
  }),
});
