import React, { Fragment, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Checkbox, IconButton, Input, Stack, TextLink, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValuesHttp, HttpRegexValidationFormValue, HttpRegexValidationType } from 'types';

import { createPath, getFieldErrorProps } from '../../utils/form';
import { InputSelect } from '../InputSelect';
import { StyledField } from '../ui/StyledField';
import { ValidationError } from '../ui/ValidationError';

const regexpSourceOptions: SelectableValue[] = [
  {
    name: 'Body',
    description: 'Fail check if regular expression matches body',
    value: HttpRegexValidationType.Body,
  },
  {
    name: 'Header',
    description: 'Fail check if regular expression matches header',
    value: HttpRegexValidationType.Header,
  },
];

function getFirstError(fieldErrorMap: Record<string, { error?: string; invalid: boolean }>) {
  return [...Object.values(fieldErrorMap)].find((item) => item.invalid)?.error;
}

interface FormHttpRegExpValidationFieldProps {
  field: CheckFormFieldPath;
  disallowBodyMatching?: boolean; // E.g. for HEAD, which has no response body
  addButtonText?: string;
}

// Note: This component handles (what becomes) `.failIfBodyMatchesRegexp` and `.failIfHeaderMatchesRegexp` fields
export function FormHttpRegExpValidationField({
  field,
  addButtonText = 'Regexp Validation',
  disallowBodyMatching,
}: FormHttpRegExpValidationFieldProps) {
  const styles = useStyles2(getStyles);
  const {
    setValue,
    control,
    register,
    watch,
    formState: { errors, disabled },
  } = useFormContext<CheckFormValuesHttp>();

  const options = useMemo(() => {
    if (disallowBodyMatching) {
      return regexpSourceOptions.map((option) => {
        if (option.value === HttpRegexValidationType.Body) {
          return {
            ...option,
            disabled: true,
          };
        }
        return option;
      });
    }

    return regexpSourceOptions;
  }, [disallowBodyMatching]);

  const requestMethod = watch('settings.http.method');

  const { fields, append, remove } = useFieldArray<CheckFormValuesHttp>({ control, name: field as any });

  const newOption: HttpRegexValidationFormValue = useMemo(() => {
    return disallowBodyMatching
      ? { matchType: HttpRegexValidationType.Header, expression: '', inverted: false, allowMissing: false, header: `` }
      : {
          matchType: HttpRegexValidationType.Body,
          expression: '',
          inverted: false,
        };
  }, [disallowBodyMatching]);

  const hasFields = fields.length > 0;

  return (
    <Stack direction="column" gap={1}>
      <StyledField
        label="Regexp validation"
        description={
          <>
            Check fails if condition matches regexp (
            <TextLink color="link" variant="bodySmall" external href="https://github.com/google/re2/wiki/Syntax">
              Go syntax
            </TextLink>
            ).
          </>
        }
        emulate
      >
        <div />
      </StyledField>

      {hasFields && (
        <div className={styles.inputGrid}>
          <div className={styles.header}>Source</div>
          <div className={cx(styles.header, styles.expressionSpan)}>Match condition</div>
          <div className={cx(styles.header, styles.centeredCell)}>Invert</div>
          <div className={cx(styles.header, styles.centeredCell)}>Allow missing</div>
          <div className={styles.header} />

          {fields.map((fieldArray, index) => {
            const isHeaderMatchType = watch(createPath(field, index, 'matchType')) === HttpRegexValidationType.Header;
            const errorMap = {
              header: getFieldErrorProps(errors, [field, index, 'header']),
              expression: getFieldErrorProps(errors, [field, index, 'expression']),
              inverted: getFieldErrorProps(errors, [field, index, 'inverted']),
              allowMissing: getFieldErrorProps(errors, [field, index, 'allowMissing']),
            };
            const firstFieldError = getFirstError(errorMap);
            const hasFieldRowError = firstFieldError !== undefined;
            const hasDisallowedType = !isHeaderMatchType && disallowBodyMatching;

            return (
              <Fragment key={fieldArray.id}>
                <InputSelect
                  className={styles.firstColumn}
                  options={options}
                  value={watch(createPath(field, index, 'matchType'))}
                  onChange={({ target }) =>
                    setValue(createPath(field, index, 'matchType'), target.value, { shouldDirty: true })
                  }
                  disabled={disabled}
                  aria-label={`Source for validation ${index + 1}`}
                />

                {isHeaderMatchType && (
                  <StyledField invalid={errorMap.header.invalid} htmlFor={`${fieldArray.id}-header`}>
                    <Input
                      id={`${fieldArray.id}-header`}
                      placeholder="Header name"
                      {...register(createPath(field, index, 'header'))}
                      disabled={disabled}
                      aria-label={`Header name for validation ${index + 1}`}
                    />
                  </StyledField>
                )}
                <StyledField
                  className={cx(!isHeaderMatchType && styles.expressionSpan)}
                  invalid={errorMap.expression.invalid}
                  htmlFor={`${fieldArray.id}-expression`}
                >
                  <Input
                    id={`${fieldArray.id}-expression`}
                    placeholder="Regular expression"
                    {...register(createPath(field, index, 'expression'))}
                    disabled={disabled}
                    aria-label={`Regular expression for validation ${index + 1}`}
                  />
                </StyledField>

                <StyledField
                  className={styles.centeredCell}
                  invalid={errorMap.inverted.invalid}
                  htmlFor={`${fieldArray.id}-inverted`}
                >
                  <Checkbox
                    id={`${fieldArray.id}-inverted`}
                    {...register(createPath(field, index, 'inverted'))}
                    disabled={disabled}
                    aria-label={`Invert match for validation ${index + 1}`}
                  />
                </StyledField>

                {/*
                  fiddling with key allows for the input to look empty if type is changed,
                  but repopulate with previous value if type is changed back
                */}
                <StyledField
                  className={styles.centeredCell}
                  invalid={errorMap.allowMissing.invalid}
                  htmlFor={`${fieldArray.id}-allowMissing`}
                >
                  <Checkbox
                    id={`${fieldArray.id}-allowMissing`}
                    key={isHeaderMatchType ? createPath(field, index, 'allowMissing') : undefined}
                    disabled={disabled}
                    {...(isHeaderMatchType ? register(createPath(field, index, 'allowMissing')) : { disabled: true })}
                    aria-label={`Allow missing header for validation ${index + 1}`}
                  />
                </StyledField>

                <IconButton
                  aria-label="Remove regexp validation"
                  name="minus"
                  className={styles.centeredCell}
                  onClick={() => remove(index)}
                  disabled={disabled}
                />
                {hasFieldRowError && (
                  <>
                    {Boolean(errorMap.header.error) && (
                      <div className={styles.errorRow}>
                        <ValidationError>{errorMap.header.error}</ValidationError>
                      </div>
                    )}

                    {Boolean(errorMap.expression.error) && (
                      <div className={cx(styles.errorRow, isHeaderMatchType && styles.expressionWithHeaderErrorColumn)}>
                        <ValidationError>{errorMap.expression.error}</ValidationError>
                      </div>
                    )}
                  </>
                )}
                {hasDisallowedType && (
                  <div className={styles.typeWarning}>
                    <ValidationError severity="warning">
                      Body matching is not available for the current request method ({requestMethod}).
                    </ValidationError>
                  </div>
                )}
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
      grid-template-columns: minmax(auto, 100px) auto auto minmax(auto, 60px) minmax(auto, 110px) minmax(auto, 30px);
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
