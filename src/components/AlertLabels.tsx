import { useStyles, Input, Button, Label } from '@grafana/ui';
import React, { FC, Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { SubCollapse } from './SubCollapse';
import { css } from 'emotion';
import { GrafanaTheme } from '@grafana/data';

interface Props {}

const NAME = 'alert.labels';

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
});

export const AlertLabels: FC<Props> = () => {
  const styles = useStyles(getStyles);
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: NAME,
  });

  return (
    <SubCollapse title="Labels">
      <div className={styles.grid}>
        {fields.length ? (
          <>
            <Label>Name</Label>
            <Label>Value</Label>
            <div />
          </>
        ) : null}
        {fields.map((field, index) => (
          <Fragment key={field.id}>
            <Input ref={register()} name={`${NAME}[${index}].name`} placeholder="Name" />
            <Input ref={register()} name={`${NAME}[${index}].value`} placeholder="Value" />
            <Button type="button" onClick={() => remove(index)} variant="link">
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
