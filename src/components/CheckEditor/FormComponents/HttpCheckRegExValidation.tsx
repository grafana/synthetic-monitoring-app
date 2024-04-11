import React, { Fragment } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, Checkbox, IconButton, Input, Label, Select, Switch, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckFormValuesHttp, HttpMethod, HttpRegexValidationType } from 'types';
import { hasRole } from 'utils';
import { HTTP_REGEX_VALIDATION_OPTIONS } from 'components/constants';

const REGEX_FIELD_NAME = 'settings.http.regexValidations';

export const HttpCheckRegExValidation = () => {
  const styles = useStyles2(getStyles);
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<CheckFormValuesHttp>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesHttp>({ control, name: REGEX_FIELD_NAME });
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <div className={styles.stackCol}>
      <Label>Regex Validation</Label>
      {Boolean(fields.length) && (
        <div className={styles.validationGrid} data-testid={DataTestIds.CHECK_FORM_HTTP_VALIDATION_REGEX}>
          <Label>Field Name</Label>
          <Label>Match condition</Label>
          <Label>Invert Match</Label>
          <Label>Allow Missing</Label>
          <div />
          {fields.map((field, index) => {
            const isHeaderMatch =
              watch(`${REGEX_FIELD_NAME}.${index}.matchType`)?.value === HttpRegexValidationType.Header;
            const disallowBodyMatching = watch('settings.http.method').value === HttpMethod.HEAD;
            const userIndex = index + 1;

            return (
              <Fragment key={field.id}>
                <div data-fs-element={`Regex validation field name ${index}`}>
                  <Controller
                    render={({ field }) => {
                      const { ref, ...rest } = field;
                      return (
                        <Select
                          {...rest}
                          aria-label={`Validation Field Name ${userIndex}`}
                          placeholder="Field name"
                          options={HTTP_REGEX_VALIDATION_OPTIONS}
                          invalid={
                            disallowBodyMatching &&
                            Boolean(errors?.settings?.http?.regexValidations?.[index]?.matchType)
                          }
                        />
                      );
                    }}
                    rules={{
                      validate: (value) => {
                        if (disallowBodyMatching) {
                          if (value?.value === HttpRegexValidationType.Body) {
                            return 'Cannot validate the body of a HEAD request';
                          }
                          return;
                        }
                        return;
                      },
                    }}
                    name={`${REGEX_FIELD_NAME}.${index}.matchType`}
                  />
                </div>
                <div className={styles.validationExpressions}>
                  {isHeaderMatch && (
                    <div className={styles.validationHeaderName}>
                      <Input
                        {...register(`${REGEX_FIELD_NAME}.${index}.header`)}
                        placeholder="Header name"
                        data-fs-element={`Regex header name ${index}`}
                      />
                    </div>
                  )}
                  <Input
                    {...register(`${REGEX_FIELD_NAME}.${index}.expression`)}
                    placeholder="Regex"
                    data-fs-element={`Regex expression ${index}`}
                  />
                </div>
                <div className={styles.validationInverted}>
                  <Checkbox
                    {...register(`${REGEX_FIELD_NAME}.${index}.inverted`)}
                    data-fs-element={`Regex inverted ${index}`}
                    aria-label={`Invert match for regex ${userIndex}`}
                  />
                </div>
                {isHeaderMatch ? (
                  <div className={styles.validationAllowMissing}>
                    <Switch
                      {...register(`${REGEX_FIELD_NAME}.${index}.allowMissing`)}
                      aria-label={`Allow missing header for regex ${userIndex}`}
                      data-fs-element={`Regex allow missing ${index}`}
                    />
                  </div>
                ) : (
                  <div />
                )}
                <IconButton
                  name="minus-circle"
                  onClick={() => remove(index)}
                  tooltip="Delete"
                  data-fs-element={`Regex delete ${index}`}
                />
              </Fragment>
            );
          })}
        </div>
      )}
      <div>
        <Button
          type="button"
          icon="plus"
          variant="secondary"
          size="sm"
          disabled={!isEditor}
          onClick={() => append({ matchType: HTTP_REGEX_VALIDATION_OPTIONS[1], expression: '', inverted: false })}
          data-fs-element="Add regex validation button"
        >
          Add Regex Validation
        </Button>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stackCol: css({
    display: `flex`,
    flexDirection: `column`,
    gap: theme.spacing(1),
  }),
  validationGrid: css({
    display: `grid`,
    gridTemplateColumns: `300px auto 70px auto auto`,
    gridGap: theme.spacing(1),
    alignItems: `center`,
  }),
  validationExpressions: css({
    display: `flex`,
    flexDirection: `row`,
    alignItems: `center`,
  }),
  validationHeaderName: css({
    marginRight: theme.spacing(1),
  }),
  validationAllowMissing: css({
    justifySelf: `start`,
  }),
  validationInverted: css({
    position: `relative`,
    justifySelf: `center`,
  }),
});
