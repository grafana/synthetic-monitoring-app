import React, { Fragment } from 'react';
import { TextArea, Input, Button, useStyles, Label, Field } from '@grafana/ui';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { SubCollapse } from 'components/SubCollapse';
import { GrafanaTheme } from '@grafana/data';
import { css } from 'emotion';
import { validateAnnotationName } from 'validation';

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

const NAME = 'annotations';

export const AlertAnnotations = () => {
  const styles = useStyles(getStyles);
  const { control, register, errors } = useFormContext();
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
            <Field
              invalid={errors?.annotations?.[annotationIndex]?.name}
              error={errors?.annotations?.[annotationIndex]?.name?.message}
            >
              <Input
                ref={register({ validate: (value) => validateAnnotationName(value) })}
                name={`${NAME}[${annotationIndex}].name`}
                placeholder="Name"
                data-testid={`alert-annotationName-${annotationIndex}`}
              />
            </Field>
            <TextArea
              ref={register()}
              name={`${NAME}[${annotationIndex}].value`}
              placeholder="Value"
              data-testid={`alert-annotationValue-${annotationIndex}`}
            />
            <Button type="button" onClick={() => remove(annotationIndex)} variant="link">
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
