import React, { Fragment } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Button, Checkbox, IconButton, Input, Label, Select, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesDns } from 'types';
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
          {fields.map((field, index) => (
            <Fragment key={field.id}>
              <Controller
                name={`settings.dns.validations.${index}.responseMatch` as const}
                rules={{ required: true }}
                render={({ field }) => {
                  const { ref, ...rest } = field;
                  return (
                    <Select
                      {...rest}
                      value={field.value}
                      aria-label={`DNS Response Match ${index + 1}`}
                      options={DNS_RESPONSE_MATCH_OPTIONS}
                      invalid={Boolean(formState.errors.settings?.dns?.validations?.[index]?.responseMatch)}
                    />
                  );
                }}
              />
              <Input
                {...register(`settings.dns.validations.${index}.expression` as const)}
                placeholder="Type expression"
              />
              <div
                className={css`
                  position: relative;
                  justify-self: center;
                `}
              >
                <Checkbox
                  {...register(`settings.dns.validations.${index}.inverted` as const)}
                  aria-label="dns-validation-inverted"
                />
              </div>
              <IconButton name="minus-circle" onClick={() => remove(index)} tooltip="Delete" />
            </Fragment>
          ))}
        </div>
      )}
      <div>
        <Button
          type="button"
          icon="plus"
          variant="secondary"
          size="sm"
          disabled={!isEditor}
          onClick={() => append({ matchType: DNS_RESPONSE_MATCH_OPTIONS[0], expression: '', inverted: false })}
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
