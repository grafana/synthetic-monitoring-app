import React from 'react';
import { useController, useFormContext } from 'react-hook-form';
import {
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
import { trackChangeThreshold } from 'features/tracking/perCheckAlertsEvents';
import { useDebounceCallback } from 'usehooks-ts';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues } from 'types';

import { PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { getAlertItemStyles } from './AlertsPerCheck.styles';

export const TLSTargetCertificateCloseToExpiringAlert = ({
  alert,
  selected,
  tooltipContent,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  tooltipContent: PopoverContent;
}) => {
  const { control, formState } = useFormContext<CheckFormValues>();

  const thresholdError = formState.errors?.alerts?.[alert.type]?.threshold?.message;
  const isFormDisabled = formState.disabled;
  const styles = useStyles2(getAlertItemStyles);

  const debouncedTrackChangeThreshold = useDebounceCallback(trackChangeThreshold, 750);

  const { field } = useController({ control, name: `alerts.${alert.type}.threshold` });

  return (
    <Stack direction={'column'}>
      <InlineFieldRow className={styles.alertRow}>
        <Text>Alert if the target&apos;s certificate expires in less than </Text>{' '}
        <InlineField
          htmlFor={`alert-threshold-${alert.type}`}
          invalid={!!thresholdError}
          error={thresholdError}
          validationMessageHorizontalOverflow={true}
          disabled={!selected || isFormDisabled}
        >
          <Input
            {...field}
            aria-label={`${alert.category} threshold`}
            aria-disabled={!selected || isFormDisabled}
            suffix={alert.unit}
            type="number"
            step="any"
            id={`alert-threshold-${alert.type}`}
            data-testid={CHECKSTER_TEST_ID.feature.perCheckAlerts[alert.type].thresholdInput}
            onChange={(e) => {
              const value = e.currentTarget.value;
              debouncedTrackChangeThreshold({ name: alert.type, threshold: value });
              return field.onChange(value !== '' ? Number(value) : '');
            }}
            width={7}
          />
        </InlineField>
        <div className={styles.alertTooltip}>
          <Tooltip content={tooltipContent} placement="bottom" interactive={true}>
            <Icon name="info-circle" />
          </Tooltip>
        </div>
      </InlineFieldRow>
    </Stack>
  );
};
