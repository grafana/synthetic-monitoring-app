import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Checkbox,
  Icon,
  InlineField,
  InlineFieldRow,
  Input,
  PopoverContent,
  Text,
  Tooltip,
  useStyles2,
} from '@grafana/ui';

import { CheckAlertType, CheckFormValues } from 'types';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';
import { getAlertItemStyles } from './AlertItem';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';

export const TLSTargetCertificateCloseToExpiringAlert = ({
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
  const styles = useStyles2(getAlertItemStyles);

  return (
    <InlineFieldRow className={styles.alertRow}>
      <Checkbox
        className={styles.alertCheckbox}
        id={`alert-${alert.type}`}
        data-testid={`checkbox-alert-${alert.type}`}
        onClick={() => handleToggleAlert(alert.type)}
        checked={selected}
      />
      <Text>Alert if the target&apos;s certificate expires in less than </Text>{' '}
      <InlineField
        htmlFor={`alert-threshold-${alert.type}`}
        invalid={!!thresholdError}
        error={thresholdError}
        validationMessageHorizontalOverflow={true}
      >
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
                data-testid={`alert-threshold-${alert.type}`}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  return field.onChange(value !== '' ? Number(value) : '');
                }}
                width={7}
                disabled={!selected || isFormDisabled}
              />
            );
          }}
        />
      </InlineField>
      <div className={styles.alertTooltip}>
        <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
          <Icon name="info-circle" />
        </Tooltip>
      </div>
    </InlineFieldRow>
  );
};
