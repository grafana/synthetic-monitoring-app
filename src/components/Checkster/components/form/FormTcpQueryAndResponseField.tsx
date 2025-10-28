import React, { ComponentProps, Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, Stack, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues } from 'types';

import { createPath } from '../../utils/form';
import { StyledField } from '../ui/StyledField';
import { GenericCheckboxField } from './generic/GenericCheckboxField';
import { GenericInputField } from './generic/GenericInputField';
import { GenericTextareaField } from './generic/GenericTextareaField';

interface FormTcpQueryAndResponseFieldProps {
  field: CheckFormFieldPath;
  label: ComponentProps<typeof StyledField>['label']; // This field requires a label
  description: ComponentProps<typeof StyledField>['description']; // This field requires a description
  addButtonText?: string;
}

const newOption = { expect: '', send: '', startTLS: false };

export function FormTcpQueryAndResponseField({
  field,
  label,
  description,
  addButtonText = 'Query/response',
}: FormTcpQueryAndResponseFieldProps) {
  const theme = useTheme2();
  const styles = getStyles(theme);

  const {
    control,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: field as any });
  const hasFields = fields.length > 0;

  return (
    <Stack direction="column" gap={1}>
      <StyledField emulate label={label} description={description}>
        <div />
      </StyledField>
      {hasFields && (
        <div className={styles.inputGrid}>
          <div className={styles.header}>Send query</div>
          <div className={styles.header}>Expect response</div>
          <div className={cx(styles.header, styles.centeredCell)}>Start TLS</div>
          <div />
          {fields.map((fieldArray, index) => {
            return (
              <Fragment key={fieldArray.id}>
                <GenericTextareaField
                  className={css`
                    // 1 row is slightly shorter than a md input (can also be dragged even shorter)
                    min-height: ${theme.spacing(theme.components.height.md)};
                    padding: 4px 8px;
                  `}
                  field={createPath(field, index, 'send')}
                  rows={1}
                  placeholder="Query"
                  aria-label={`Query to send ${index + 1}`}
                />
                <GenericInputField
                  field={createPath(field, index, 'expect')}
                  placeholder="Response"
                  aria-label={`Response to expect ${index + 1}`}
                />
                <div className={styles.centeredCell}>
                  <GenericCheckboxField
                    field={createPath(field, index, 'startTLS')}
                    aria-label={`Start TLS switch ${index + 1}`}
                  />
                </div>
                <IconButton
                  aria-label="Remove row"
                  name="minus"
                  className={styles.centeredCell}
                  onClick={() => remove(index)}
                  disabled={disabled}
                />
              </Fragment>
            );
          })}
        </div>
      )}

      <Button
        className={css`
          align-self: flex-start; // Stops button from being 100% width
        `}
        icon="plus"
        onClick={() => append(newOption)}
        variant="secondary"
        size="sm"
        type="button"
        disabled={disabled}
      >
        {addButtonText}
      </Button>
    </Stack>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    inputGrid: css`
      display: grid;
      grid-template-columns: auto auto minmax(auto, 60px) minmax(auto, 30px);
      gap: ${theme.spacing(1)};
      & > * {
        align-self: center;
      }
    `,
    centeredCell: css`
      place-self: center;
    `,
    header: css`
      font-size: ${theme.typography.bodySmall
        .fontSize}; // Can't use Text since it will nullify the font-weight and requires additional code to handle null as child
      line-height: ${theme.typography.bodySmall.lineHeight};
      font-weight: ${theme.typography.fontWeightBold};
    `,
    expressionWithHeaderErrorColumn: css`
      grid-column: 3;
    `,
    errorRow: css`
      grid-column: 2;
    `,
    typeWarning: css`
      grid-column: 1 / -1;
    `,
    firstColumn: css`
      grid-column: 1;
    `,
    expressionSpan: css`
      grid-column: 2 / span 2;
    `,
  };
}
