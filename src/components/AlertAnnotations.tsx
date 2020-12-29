import React, { FC, Fragment } from 'react';
import { TextArea, Input, Button, useStyles, Label } from '@grafana/ui';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { SubCollapse } from 'components/SubCollapse';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';

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

type Props = {
  index: number;
};

export const AlertAnnotations: FC<Props> = ({ index }) => {
  const NAME = `alerts[${index}].annotations`;
  const styles = useStyles(getStyles);
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: NAME,
  });
  return (
    <SubCollapse title="Annotations">
      <p className={styles.helpText}>
        Annotations specify a set of informational labels that can be used to store longer additional information such
        as alert descriptions or runbook links. The annotation values can be templated.
      </p>
      <div className={styles.grid}>
        {fields.length ? (
          <>
            <Label>Name</Label>
            <Label>Annotation</Label>
            <div />
          </>
        ) : null}
        {fields.map((field, annotationIndex) => (
          <Fragment key={field.id}>
            <Input
              ref={register()}
              name={`${NAME}[${annotationIndex}].name`}
              placeholder="Name"
              data-testid={`alert-${index}-annotationName-${annotationIndex}`}
            />
            <TextArea
              ref={register()}
              name={`${NAME}[${annotationIndex}].value`}
              placeholder="Value"
              data-testid={`alert-${index}-annotationValue-${annotationIndex}`}
            />
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
        Add annotation
      </Button>
    </SubCollapse>
  );
};
