import React, { Fragment } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, Checkbox, IconButton, Input, Label, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesDns, ResponseMatchType } from 'types';
import { hasRole } from 'utils';
import { DNS_RESPONSE_MATCH_OPTIONS } from 'components/constants';

export const DNSCheckResponseMatches = () => {
  const styles = useStyles2(getStyles);
  const { control, register, formState } = useFormContext<CheckFormValuesDns>();
  const { fields, append, remove } = useFieldArray<CheckFormValuesDns>({ control, name: `settings.dns.validations` });
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <div className={styles.stackCol}>
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
                <Controller
                  name={`settings.dns.validations.${index}.responseMatch`}
                  rules={{ required: true }}
                  render={({ field }) => {
                    const { ref, onChange, ...rest } = field;
                    return (
                      <Select
                        {...rest}
                        value={field.value}
                        aria-label={`DNS Response Match ${userIndex}`}
                        options={DNS_RESPONSE_MATCH_OPTIONS}
                        invalid={Boolean(formState.errors.settings?.dns?.validations?.[index]?.responseMatch)}
                        onChange={({ value }) => onChange(value)}
                      />
                    );
                  }}
                />
                <Input {...register(`settings.dns.validations.${index}.expression`)} placeholder="Type expression" />
                <div
                  className={css`
                    position: relative;
                    justify-self: center;
                  `}
                >
                  <Checkbox
                    {...register(`settings.dns.validations.${index}.inverted`)}
                    aria-label={`Invert match for regex ${userIndex}`}
                  />
                </div>
                <IconButton name="minus-circle" onClick={() => remove(index)} tooltip="Delete" />
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
          onClick={() => append({ responseMatch: ResponseMatchType.Authority, expression: '', inverted: false })}
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
    gridTemplateColumns: `auto auto 70px auto`,
    gridGap: theme.spacing(1),
    alignItems: `center`,
  }),
});
