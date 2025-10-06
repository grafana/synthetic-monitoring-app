import React, { Fragment, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import {
  Button,
  Checkbox,
  Dropdown,
  Icon,
  IconButton,
  Input,
  Menu,
  Stack,
  TextLink,
  useStyles2,
  useTheme2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormFieldPath } from '../../types';
import { CheckFormValuesHttp, HttpRegexValidationFormValue, HttpRegexValidationType } from 'types';

import { getBodySmallStyles, getInputFocusStyles } from '../../styles';
import { createPath, getFieldErrorProps } from '../../utils/form';
import { StyledField } from '../ui/StyledField';
import { ValidationError } from '../ui/ValidationError';
import { ValidationWarning } from '../ui/ValidationWarning';

interface SourceMenuProps {
  value: SelectableValue<string>['value'];
  options: SelectableValue[];
  disallowBodyMatching?: boolean; // E.g. for HEAD, which has no response body
}

function SourceMenu({
  options,
  value,
  onChange,
  disallowBodyMatching,
}: SourceMenuProps & { onChange: (value: string) => void }) {
  return (
    <Menu>
      {options.map((option, index) => (
        <Menu.Item
          key={index}
          label={option.value}
          disabled={option.isDisabled || (disallowBodyMatching && option.value === HttpRegexValidationType.Body)}
          ariaChecked={value === option.value}
          active={value === option.value}
          onClick={() => {
            onChange(option.value);
          }}
          description={option.description}
        />
      ))}
    </Menu>
  );
}

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

interface SourceMenuDropdownProps {
  onChange: (value: SelectableValue<string>['value']) => void;
  value: string;
  disallowBodyMatching?: boolean; // E.g. for HEAD, which has no response body
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
}

function SourceMenuDropdown({
  disabled,
  className,
  onChange,
  value,
  disallowBodyMatching,
  invalid,
}: SourceMenuDropdownProps) {
  const theme = useTheme2();
  return (
    <>
      <Dropdown
        placement="auto-start"
        overlay={
          <SourceMenu
            options={regexpSourceOptions}
            onChange={onChange}
            value={value}
            disallowBodyMatching={disallowBodyMatching}
          />
        }
      >
        <button
          type="button"
          role="menu"
          aria-valuetext={value}
          className={cx(
            css`
              /* The idea is for the button to look like an Input/Select */
              display: flex;
              background-color: ${theme.components.input.background};
              border: 1px ${theme.components.input.borderColor} solid;
              padding: ${theme.spacing(0, 1)};
              border-radius: ${theme.shape.radius.default};
              color: ${theme.components.input.text};
              align-items: center;
              justify-content: space-between;
              &[disabled] {
                cursor: not-allowed;
                background-color: ${theme.colors.action.disabledBackground};
                color: ${theme.colors.action.disabledText};
                border-color: ${theme.colors.action.disabledBackground};
              }
              &:focus {
                ${getInputFocusStyles(theme)};
              }
              ,
              &:hover {
                border-color: ${theme.components.input.borderHover};
              }
            `,
            invalid &&
              css`
                border-color: ${theme.colors.warning.border};
                color: ${theme.colors.warning.text};
                &:hover {
                  border-color: ${theme.colors.warning.shade};
                }
              `,
            className
          )}
          aria-label={`Regexp source menu`}
          aria-disabled={disabled}
          disabled={disabled}
        >
          <span>{value}</span>
          <Icon name="angle-down" />
        </button>
      </Dropdown>
    </>
  );
}

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
                <SourceMenuDropdown
                  className={styles.firstColumn}
                  value={watch(createPath(field, index, 'matchType'))}
                  onChange={(value) => setValue(createPath(field, index, 'matchType'), value)}
                  disallowBodyMatching={disallowBodyMatching}
                  disabled={disabled}
                  invalid={hasDisallowedType}
                />

                {isHeaderMatchType && (
                  <StyledField invalid={errorMap.header.invalid} htmlFor={`${fieldArray.id}-header`}>
                    <Input
                      id={`${fieldArray.id}-header`}
                      placeholder="Header name"
                      {...register(createPath(field, index, 'header'))}
                      disabled={disabled}
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
                    <ValidationWarning>
                      Body matching is not available for the current request method ({requestMethod}).
                    </ValidationWarning>
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
      ${getBodySmallStyles(theme)};
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
