import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Field, Input, Label, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const AlertItem = ({
  alert,
  selected,
  onSelectionChange,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
}) => {
  const styles = useStyles2(getStyles);

  const { control, formState, getValues } = useFormContext<CheckFormValues>();
  const { isFormDisabled } = useCheckFormContext();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const threshold: number = getValues(`alerts.${alert.type}.threshold`);
  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;

  return (
    <div key={alert.type} className={styles.item}>
      <div className={styles.itemInfo}>
        <Checkbox id={`alert-${alert.type}`} onClick={() => handleToggleAlert(alert.type)} checked={selected} />
        <Label htmlFor={`alert-${alert.type}`} className={styles.columnLabel}>
          {alert.name}
        </Label>
      </div>
      <div className={styles.thresholdInput}>
        <Field
          label={`Threshold`}
          htmlFor={`alert-threshold-${alert.type}`}
          invalid={Boolean(thresholdError)}
          error={thresholdError}
        >
          <Controller
            name={`alerts.${alert.type}.threshold`}
            control={control}
            render={({ field }) => (
              <Input
                aria-disabled={!selected}
                suffix={alert.unit}
                type="number"
                step="any"
                id={`alert-threshold-${alert.type}`}
                value={field.value !== undefined ? field.value : threshold}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  return field.onChange(value !== '' ? Number(value) : undefined);
                }}
                width={10}
                disabled={!selected || isFormDisabled}
              />
            )}
          />
        </Field>
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  item: css({
    display: `flex`,
    gap: theme.spacing(1),
    marginLeft: theme.spacing(1),
  }),

  itemInfo: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '50%',
    textWrap: 'wrap',
  }),

  columnLabel: css({
    fontWeight: theme.typography.fontWeightLight,
    fontSize: theme.typography.h6.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    marginBottom: '0',
  }),

  thresholdInput: css({
    marginLeft: '22px',
  }),
});
