import React, { FC, Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, Input, Label, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { validateLabelName, validateLabelValue } from 'validation';

import { SubCollapse } from './SubCollapse';

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    grid-column-gap: ${theme.spacing(2)};
    grid-row-gap: ${theme.spacing(1)};
  `,
  addButton: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  helpText: css`
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
const NAME = 'labels';

export const AlertLabels: FC = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    register,
    formState: { errors },
    watch,
  } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: NAME,
  });

  const labels = watch('labels');

  return (
    <SubCollapse title="Labels">
      <p className={styles.helpText}>
        Labels allow you to specify a set of additional labels to be attached to the alert. Any existing conflicting
        labels will be overwritten. The label values can be templated.
      </p>
      <div className={styles.grid}>
        {fields.length ? (
          <>
            <Label>Name</Label>
            <Label>Value</Label>
            <div />
          </>
        ) : null}
        {fields.map((field, labelIndex) => (
          <Fragment key={field.id}>
            <Field error={errors?.labels?.[labelIndex]?.name?.message} invalid={errors?.labels?.[labelIndex]?.name}>
              <Input
                {...register(`${NAME}.${labelIndex}.name` as const, {
                  validate: (value) => validateLabelName(value, labels),
                })}
                placeholder="Name"
                data-testid={`alert-labelName-${labelIndex}`}
              />
            </Field>
            <Field error={errors?.labels?.[labelIndex]?.value?.message} invalid={errors?.labels?.[labelIndex]?.value}>
              <Input
                {...register(`${NAME}.${labelIndex}.value` as const, {
                  validate: (value) => validateLabelValue(value),
                })}
                placeholder="Value"
                data-testid={`alert-labelValue-${labelIndex}`}
              />
            </Field>
            <Button type="button" onClick={() => remove(labelIndex)} fill="text">
              Delete
            </Button>
          </Fragment>
        ))}
      </div>
      <Button type="button" fill="text" size="sm" icon="plus" onClick={() => append({})} className={styles.addButton}>
        Add label
      </Button>
    </SubCollapse>
  );
};
