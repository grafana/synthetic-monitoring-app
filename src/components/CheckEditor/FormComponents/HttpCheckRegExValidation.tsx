import React from 'react';
import { Controller, FieldErrors, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, Button, Checkbox, Field, IconButton, Input, Label, Select, Stack, Switch, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import {
  CheckFormValuesHttp,
  HttpMethod,
  HttpRegexHeaderValidationFormValue,
  HttpRegexValidationFormValue,
  HttpRegexValidationType,
} from 'types';
import { HTTP_REGEX_VALIDATION_OPTIONS } from 'components/constants';

const REGEX_FIELD_NAME = 'settings.http.regexValidations';

export const HttpCheckRegExValidation = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    register,
    watch,
    formState: { errors, disabled: isFormDisabled },
  } = useFormContext<CheckFormValuesHttp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesHttp>({ control, name: REGEX_FIELD_NAME });
  const disallowBodyMatching = watch('settings.http.method') === HttpMethod.HEAD;
  const options = disallowBodyMatching
    ? HTTP_REGEX_VALIDATION_OPTIONS.filter((option) => option.value !== HttpRegexValidationType.Body)
    : HTTP_REGEX_VALIDATION_OPTIONS;
  const newOption: HttpRegexValidationFormValue = disallowBodyMatching
    ? { matchType: HttpRegexValidationType.Header, expression: '', inverted: false, allowMissing: false, header: `` }
    : {
        matchType: HttpRegexValidationType.Body,
        expression: '',
        inverted: false,
      };

  return (
    <Box marginBottom={2}>
      <Stack direction={`column`} gap={2} data-testid={DataTestIds.CHECK_FORM_HTTP_VALIDATION_REGEX}>
        <Label>Regex Validation</Label>
        {Boolean(fields.length) && (
          <Stack direction={`column`}>
            <div className={styles.validationGrid}>
              <Label>Field Name</Label>
              <Label>Match condition</Label>
              <Label>Invert Match</Label>
              <Label>Allow Missing</Label>
              <div />
            </div>

            {fields.map((field, index) => {
              const isHeaderMatch = watch(`${REGEX_FIELD_NAME}.${index}.matchType`) === HttpRegexValidationType.Header;
              const userIndex = index + 1;
              const baseErrorPath = errors?.settings?.http?.regexValidations?.[index];

              return (
                <div className={styles.validationGrid} key={field.id}>
                  <div data-fs-element={`Regex validation field name ${index}`}>
                    <Controller
                      render={({ field }) => {
                        const { ref, onChange, ...rest } = field;
                        return (
                          <Select
                            {...rest}
                            aria-label={`Validation Field Name ${userIndex}`}
                            disabled={isFormDisabled}
                            onChange={({ value }) => onChange(value)}
                            options={options}
                            placeholder="Field name"
                          />
                        );
                      }}
                      name={`${REGEX_FIELD_NAME}.${index}.matchType`}
                    />
                  </div>
                  <div className={styles.validationExpressions}>
                    {isHeaderMatch && (
                      <div className={styles.validationHeaderName}>
                        <Field
                          className={styles.field}
                          invalid={isHttpRegexHeaderError(baseErrorPath) && Boolean(baseErrorPath?.header)}
                          error={isHttpRegexHeaderError(baseErrorPath) && baseErrorPath?.header?.message}
                        >
                          <Input
                            {...register(`${REGEX_FIELD_NAME}.${index}.header`)}
                            aria-label={`Header name for validation ${userIndex}`}
                            data-fs-element={`Regex header name ${index}`}
                            disabled={isFormDisabled}
                            placeholder="Header name"
                          />
                        </Field>
                      </div>
                    )}
                    <Field
                      className={cx(styles.field, styles.grow)}
                      invalid={Boolean(baseErrorPath?.expression)}
                      error={baseErrorPath?.expression?.message}
                    >
                      <Input
                        {...register(`${REGEX_FIELD_NAME}.${index}.expression`)}
                        aria-label={`Regex expression for validation ${userIndex}`}
                        data-fs-element={`Regex expression ${index}`}
                        disabled={isFormDisabled}
                        placeholder="Regex"
                      />
                    </Field>
                  </div>
                  <div className={styles.validationInverted}>
                    <Checkbox
                      {...register(`${REGEX_FIELD_NAME}.${index}.inverted`)}
                      aria-label={`Invert match for validation ${userIndex}`}
                      data-fs-element={`Regex inverted ${index}`}
                      disabled={isFormDisabled}
                    />
                  </div>
                  {isHeaderMatch ? (
                    <div className={styles.validationAllowMissing}>
                      <Switch
                        {...register(`${REGEX_FIELD_NAME}.${index}.allowMissing`)}
                        aria-label={`Allow missing header for validation ${userIndex}`}
                        data-fs-element={`Regex allow missing ${index}`}
                        disabled={isFormDisabled}
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                  <IconButton
                    aria-label={`Delete regex validation ${userIndex}`}
                    className={styles.removeButtonWrapper}
                    data-fs-element={`Regex delete ${index}`}
                    disabled={isFormDisabled}
                    name="minus-circle"
                    onClick={() => remove(index)}
                    tooltip="Delete"
                  />
                </div>
              );
            })}
          </Stack>
        )}
        <div>
          <Button
            data-fs-element="Add regex validation button"
            disabled={isFormDisabled}
            icon="plus"
            onClick={() => append(newOption)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Add Regex Validation
          </Button>
        </div>
      </Stack>
    </Box>
  );
};

function isHttpRegexHeaderError(
  errors?: FieldErrors<HttpRegexValidationFormValue>
): errors is FieldErrors<HttpRegexHeaderValidationFormValue> {
  return errors ? 'header' in errors : false;
}

const getStyles = (theme: GrafanaTheme2) => ({
  grow: css({
    flexGrow: 1,
  }),
  field: css({
    marginBottom: 0,
  }),
  validationGrid: css({
    display: `grid`,
    gridTemplateColumns: `2fr 4fr 1fr 1fr 1fr`,
    gridGap: theme.spacing(1),
    alignItems: `start`,
  }),
  validationExpressions: css({
    display: `flex`,
    flexDirection: `row`,
    alignItems: `start`,
  }),
  validationHeaderName: css({
    marginRight: theme.spacing(1),
  }),
  validationAllowMissing: css({
    justifySelf: `center`,
    marginTop: theme.spacing(1),
  }),
  validationInverted: css({
    position: `relative`,
    justifySelf: `center`,
    marginTop: theme.spacing(0.5),
  }),
  removeButtonWrapper: css({
    marginTop: theme.spacing(1),
  }),
});
