import React, { ComponentProps, Fragment } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, Stack, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValues, ResponseMatchType } from 'types';

import { DNS_RESPONSE_MATCH_OPTIONS } from '../../constants';
import { createPath } from '../../utils/form';
import { StyledField } from '../ui/StyledField';
import { GenericCheckboxField } from './generic/GenericCheckboxField';
import { GenericInputField } from './generic/GenericInputField';
import { GenericInputSelectField } from './generic/GenericInputSelectField';

interface FormDnsRegExpValidationFieldProps {
  field: CheckFormFieldPath;
  addButtonText?: string;
  label: ComponentProps<typeof StyledField>['label'];
  description?: ComponentProps<typeof StyledField>['description'];
}

interface RegexpItem {
  responseMatch: ResponseMatchType;
  expression: string;
  inverted: boolean;
}

const newItem: RegexpItem = {
  responseMatch: ResponseMatchType.Authority,
  expression: '',
  inverted: false,
};

const selectInputWidth = 13; // times theme.spacing

export function FormDnsRegExpValidationField({
  field,
  addButtonText = 'Regexp validation',
  label,
  description,
}: FormDnsRegExpValidationFieldProps) {
  const styles = useStyles2(getStyles);
  const {
    control,
    formState: { disabled },
  } = useFormContext<CheckFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: field as any });
  const hasFields = fields.length > 0;

  return (
    <Stack direction="column" gap={1}>
      <StyledField label={label} description={description} emulate>
        <div />
      </StyledField>
      {hasFields && (
        <div className={styles.inputGrid}>
          <div className={styles.header}>Subject</div>
          <div className={styles.header}>Regular expression</div>
          <div className={cx(styles.header, styles.centeredCell)}>Invert</div>
          <div />
          {hasFields &&
            fields.map((fieldArray, index) => {
              return (
                <Fragment key={fieldArray.id}>
                  <GenericInputSelectField
                    width={selectInputWidth}
                    field={createPath(field, index, 'responseMatch')}
                    aria-label={`Match subject for validation ${index + 1}`}
                    options={DNS_RESPONSE_MATCH_OPTIONS}
                  />

                  <GenericInputField
                    aria-label={`Expression for validation ${index + 1}`}
                    field={createPath(field, index, 'expression')}
                  />

                  <div className={styles.centeredCell}>
                    <GenericCheckboxField
                      field={createPath(field, index, 'inverted')}
                      aria-label={`Invert match for validation ${index + 1}`}
                    />
                  </div>

                  <IconButton disabled={disabled} name="minus" onClick={() => remove(index)} tooltip="Delete" />
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
        onClick={() => append(newItem)}
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
      grid-template-columns: minmax(auto, ${theme.spacing(selectInputWidth)}) auto minmax(auto, 60px) minmax(auto, 30px);
      gap: ${theme.spacing(1)};
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
