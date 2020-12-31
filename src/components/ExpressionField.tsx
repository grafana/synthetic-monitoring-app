import React, { FC } from 'react';
import { Field, Input, Label, Select, useStyles } from '@grafana/ui';
import { GrafanaTheme } from '@grafana/data';
import { Controller, useFormContext, Field as FormField } from 'react-hook-form';
import { AlertFormValues } from 'types';
import { TIME_UNIT_OPTIONS } from './constants';

import { css } from 'emotion';

const getStyles = (theme: GrafanaTheme) => ({
  inputWrapper: css`
    margin-bottom: ${theme.spacing.sm};
  `,
  numberInput: css`
    max-width: 72px;
    margin: 0 ${theme.spacing.sm};
  `,
  horizontallyAligned: css`
    display: flex;
    align-items: center;
  `,
  horizontalFlexRow: css`
    display: flex;
    align-items: center;
  `,
  text: css`
    font-size: ${theme.typography.size.sm};
    color: ${theme.colors.formLabel};
  `,
  select: css`
    max-width: 200px;
  `,
  clearMarginBottom: css`
    margin-bottom: 0;
  `,
});

interface Props {
  editing: boolean;
  field: Pick<AlertFormValues, 'probeCount' | 'timeCount' | 'timeUnit'>;
  index: number;
}

export const ExpressionField: FC<Props> = ({ editing, field, index }) => {
  const { errors, register, watch } = useFormContext();
  const probeCount = watch('probeCount');
  const styles = useStyles(getStyles);
  return (
    <div className={styles.inputWrapper}>
      <Label>Expression</Label>
      <div className={styles.horizontalFlexRow}>
        {editing ? (
          <span className={styles.text}>If probes report connection errors for</span>
        ) : (
          <div className={styles.horizontallyAligned}>
            <span className={styles.text}>An alert will fire if</span>
            <Field
              className={styles.clearMarginBottom}
              invalid={errors?.alerts?.[index]?.probeCount}
              error={errors?.alerts?.[index]?.probeCount?.message}
              horizontal
            >
              <Input
                ref={register({
                  required: true,
                  max: {
                    value: probeCount,
                    message: `There are ${probeCount} probes configured for this check`,
                  },
                })}
                name={`alerts[${index}].probeCount`}
                id={`probe-count-${index}`}
                type="number"
                placeholder="number"
                className={styles.numberInput}
                defaultValue={field.probeCount}
                data-testid={`alert-probeCount-${index}`}
              />
            </Field>

            <span className={styles.text}>or more probes report connection errors for</span>
          </div>
        )}

        <Field
          className={styles.clearMarginBottom}
          invalid={errors?.alerts?.[index]?.timeCount}
          error={errors?.alerts?.[index]?.timeCount?.message}
          horizontal
        >
          <Input
            type={'number'}
            ref={register({ required: true })}
            name={`alerts[${index}].timeCount`}
            id={`alert-time-quantity-${index}`}
            placeholder="number"
            className={styles.numberInput}
            defaultValue={field.timeCount}
            data-testid={`alert-timeCount-${index}`}
          />
        </Field>
        <Controller
          as={Select}
          name={`alerts[${index}].timeUnit`}
          options={TIME_UNIT_OPTIONS}
          className={styles.select}
          defaultValue={field.timeUnit}
          data-testid={`alert-timeUnit-${index}`}
        />
      </div>
    </div>
  );
};
