import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Checkbox,
  Icon,
  InlineField,
  InlineFieldRow,
  Input,
  PopoverContent,
  Stack,
  Text,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { trackChangeThreshold, trackSelectAlert, trackUnSelectAlert } from 'features/tracking/perCheckAlertsEvents';
import { useDebounceCallback } from 'usehooks-ts';

import { CheckAlertType, CheckFormValues } from 'types';

import { getAlertItemStyles } from './AlertItem';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { RunbookUrl } from './RunbookUrl';

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
  const { control, formState } = useFormContext<CheckFormValues>();

  const handleToggleAlert = (type: CheckAlertType) => {
    onSelectionChange(type);
    if (selected) {
      trackUnSelectAlert({ name: type });
    } else {
      trackSelectAlert({ name: type });
    }
  };

  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;
  const tlsError = formState.errors?.alerts?.[alert.type]?.isSelected?.message;
  const isFormDisabled = formState.disabled;
  const styles = useStyles2(getAlertItemStyles);

  const debouncedTrackChangeThreshold = useDebounceCallback(trackChangeThreshold, 750);

  return (
    <Stack direction={'column'}>
      <InlineFieldRow className={styles.alertRow}>
        <InlineField
          invalid={!!tlsError}
          error={tlsError}
          htmlFor={`alert-${alert.type}`}
          validationMessageHorizontalOverflow={true}
        >
          <Checkbox
            className={styles.alertCheckbox}
            id={`alert-${alert.type}`}
            data-testid={`checkbox-alert-${alert.type}`}
            onClick={() => handleToggleAlert(alert.type)}
            checked={selected}
            disabled={isFormDisabled}
          />
        </InlineField>
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
                  aria-disabled={!selected || isFormDisabled}
                  suffix={alert.unit}
                  type="number"
                  step="any"
                  id={`alert-threshold-${alert.type}`}
                  data-testid={`alert-threshold-${alert.type}`}
                  onChange={(e) => {
                    const value = e.currentTarget.value;
                    debouncedTrackChangeThreshold({ name: alert.type, threshold: value });
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
      <RunbookUrl alertType={alert.type} selected={selected} disabled={isFormDisabled} />
    </Stack>
  );
};
