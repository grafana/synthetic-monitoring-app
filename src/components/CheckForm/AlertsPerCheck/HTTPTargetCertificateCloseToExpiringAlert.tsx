import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Field, Icon, Input, PopoverContent, Stack, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const HTTPTargetCertificateCloseToExpiringAlert = ({
  alert,
  selected,
  onSelectionChange,
  tooltipContent,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
  tooltipContent: PopoverContent;
}) => {
  const { isFormDisabled } = useCheckFormContext();
  const { control, formState } = useFormContext<CheckFormValues>();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
  };

  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;
  const styles = useStyles2(getStyles);

  return (
    <Stack alignItems="center">
      <Stack alignItems="center">
        <Checkbox
          id={`alert-${alert.type}`}
          data-testid={`checkbox-alert-${alert.type}`}
          onClick={() => handleToggleAlert(alert.type)}
          checked={selected}
        />
        <Stack alignItems="center">
          Alert if the target&apos;s certificate expires in less than{' '}
          <div className={styles.thresholdInput}>
            <Field htmlFor={`alert-threshold-${alert.type}`} invalid={!!thresholdError} error={thresholdError}>
              <Controller
                name={`alerts.${alert.type}.threshold`}
                control={control}
                render={({ field }) => {
                  return (
                    <Input
                      {...field}
                      aria-disabled={!selected}
                      suffix={alert.unit}
                      type="number"
                      step="any"
                      id={`alert-threshold-${alert.type}`}
                      onChange={(e) => {
                        const value = e.currentTarget.value;
                        return field.onChange(value !== '' ? Number(value) : '');
                      }}
                      width={10}
                      disabled={!selected || isFormDisabled}
                    />
                  );
                }}
              />
            </Field>
          </div>
        </Stack>
      </Stack>
      <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
        <Icon name="info-circle" />
      </Tooltip>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  thresholdInput: css({
    '& > div': {
      marginBottom: 0,
    },
  }),
});
