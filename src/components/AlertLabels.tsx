import { useStyles, Input, Button, Label } from '@grafana/ui';
import React, { FC, Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { SubCollapse } from './SubCollapse';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';

const getStyles = (theme: GrafanaTheme) => ({
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    grid-column-gap: ${theme.spacing.lg};
    grid-row-gap: ${theme.spacing.sm};
  `,
  addButton: css`
    margin: ${theme.spacing.md} 0;
  `,
  helpText: css`
    font-size: ${theme.typography.size.sm};
  `,
});
const NAME = 'labels';

export const AlertLabels: FC = () => {
  const styles = useStyles(getStyles);
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: NAME,
  });

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
            <Input
              ref={register()}
              name={`${NAME}[${labelIndex}].name`}
              placeholder="Name"
              data-testid={`alert-labelName-${labelIndex}`}
            />
            <Input
              ref={register()}
              name={`${NAME}[${labelIndex}].value`}
              placeholder="Value"
              data-testid={`alert-labelValue-${labelIndex}`}
            />
            <Button type="button" onClick={() => remove(labelIndex)} variant="link">
              Delete
            </Button>
          </Fragment>
        ))}
      </div>
      <Button
        type="button"
        variant="link"
        size="sm"
        icon="plus"
        onClick={() => append({})}
        className={styles.addButton}
      >
        Add label
      </Button>
    </SubCollapse>
  );
};
