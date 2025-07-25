import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { InlineField, InlineFieldRow, Input, Text, useStyles2 } from '@grafana/ui';

import { CheckAlertType, CheckFormValues } from 'types';

import { getAlertItemStyles } from './AlertItem';

interface RunbookUrlProps {
  alertType: CheckAlertType;
  selected: boolean;
  disabled?: boolean;
}

export const RunbookUrl = ({ alertType, selected, disabled = false }: RunbookUrlProps) => {
  const { control, formState } = useFormContext<CheckFormValues>();
  const styles = useStyles2(getAlertItemStyles);

  const runbookUrlError = formState.errors?.alerts?.[alertType]?.runbookUrl?.message;

  if (!selected) {
    return null;
  }

  return (
    <InlineFieldRow className={styles.alertRow}>
      <Text>Runbook URL (optional): </Text>
      <InlineField
        htmlFor={`alert-runbook-url-${alertType}`}
        invalid={!!runbookUrlError}
        error={runbookUrlError}
        validationMessageHorizontalOverflow={true}
        grow={true}
      >
        <Controller
          name={`alerts.${alertType}.runbookUrl`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`alert-runbook-url-${alertType}`}
              data-testid={`alert-runbook-url-${alertType}`}
              placeholder="https://example.com/runbook"
              disabled={!selected || disabled}
              width={40}
            />
          )}
        />
      </InlineField>
    </InlineFieldRow>
  );
};
