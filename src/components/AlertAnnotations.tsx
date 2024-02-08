import React, { Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Field, Input, Label, TextArea, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { validateAnnotationName } from 'validation';
import { SubCollapse } from 'components/SubCollapse';

const getStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    grid-column-gap: ${theme.spacing(2)};
    grid-row-gap: ${theme.spacing(1)};
  `,
  addButton: css`
    margin: ${theme.spacing(2)} 0;
  `,
  helpText: css`
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});

const NAME = 'annotations';

export const AlertAnnotations = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();
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
                {...register(`${NAME}.${annotationIndex}.name` as const, {
                  validate: (value) => validateAnnotationName(value),
                })}
                placeholder="Name"
                data-testid={`alert-annotationName-${annotationIndex}`}
              />
            </Field>
            <TextArea
              {...register(`${NAME}.${annotationIndex}.value` as const)}
              placeholder="Value"
              data-testid={`alert-annotationValue-${annotationIndex}`}
            />
            <Button type="button" onClick={() => remove(annotationIndex)} fill="text">
              Delete
            </Button>
          </Fragment>
        ))}
      </div>
      <Button type="button" fill="text" size="sm" icon="plus" onClick={() => append({})} className={styles.addButton}>
        Add annotation
      </Button>
    </SubCollapse>
  );
};
