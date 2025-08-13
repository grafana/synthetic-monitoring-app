import React, { Fragment } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Checkbox, IconButton, Input, Label, Select, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesDns, ResponseMatchType } from 'types';
import { DNS_RESPONSE_MATCH_OPTIONS } from 'components/constants';

export const DNSCheckResponseMatches = () => {
  const styles = useStyles2(getStyles);
  const { control, register, formState } = useFormContext<CheckFormValuesDns>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesDns>({ control, name: `settings.dns.validations` });
  const isFormDisabled = formState.disabled;

  return (
    <Stack direction={`column`}>
      <Label>Valid Response Matches</Label>
      {Boolean(fields.length) && (
        <div className={styles.validationGrid}>
          <Label>DNS Response Match</Label>
          <Label>Expression</Label>
          <Label>Invert Match</Label>
          <div />
          {fields.map((field, index) => {
            const userIndex = index + 1;

            return (
              <Fragment key={field.id}>
                <div data-fs-element="DNS Response Match select">
                  <Controller
                    name={`settings.dns.validations.${index}.responseMatch`}
                    render={({ field }) => {
                      const { ref, onChange, ...rest } = field;
                      return (
                        // eslint-disable-next-line @typescript-eslint/no-deprecated
                        <Select
                          {...rest}
                          aria-label={`DNS Response Match ${userIndex}`}
                          disabled={formState.disabled}
                          invalid={Boolean(formState.errors.settings?.dns?.validations?.[index]?.responseMatch)}
                          onChange={({ value }) => onChange(value)}
                          options={DNS_RESPONSE_MATCH_OPTIONS}
                          value={field.value}
                        />
                      );
                    }}
                  />
                </div>
                <Input
                  {...register(`settings.dns.validations.${index}.expression`)}
                  aria-label={`Regex expression for validation ${userIndex}`}
                  data-fs-element="DNS Response Match expression"
                  disabled={isFormDisabled}
                  placeholder="Type expression"
                />
                <div
                  className={css`
                    position: relative;
                    justify-self: center;
                  `}
                >
                  <Checkbox
                    {...register(`settings.dns.validations.${index}.inverted`)}
                    aria-label={`Invert match for validation ${userIndex}`}
                    data-fs-element="DNS Response Match invert"
                    disabled={isFormDisabled}
                  />
                </div>
                <IconButton
                  data-fs-element="Delete DNS response match button"
                  disabled={isFormDisabled}
                  name="minus-circle"
                  onClick={() => remove(index)}
                  tooltip="Delete"
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
          disabled={isFormDisabled}
          onClick={() => append({ responseMatch: ResponseMatchType.Authority, expression: '', inverted: false })}
          data-fs-element="Add DNS response match button"
        >
          Add Regex Validation
        </Button>
      </div>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  validationGrid: css({
    display: `grid`,
    gridTemplateColumns: `auto auto 70px auto`,
    gridGap: theme.spacing(1),
    alignItems: `center`,
  }),
});
