import React, { useCallback, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Alert, InlineField, Input, Stack, Text } from '@grafana/ui';

import { CheckAlertType, CheckFormValues } from 'types';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

interface RunbookUrlProps {
  alertType: CheckAlertType;
  selected: boolean;
  disabled?: boolean;
}

export const RunbookUrl = ({ alertType, selected, disabled = false }: RunbookUrlProps) => {
  const { control, formState } = useFormContext<CheckFormValues>();
  const urlSearchParams = useURLSearchParams();

  const runbookUrlError = formState.errors?.alerts?.[alertType]?.runbookUrl?.message;

  // Check if this specific alert type is missing a runbook
  const missingRunbookType = urlSearchParams.get('runbookMissing') as CheckAlertType | null;
  const [showMissingRunbookMessage, setShowMissingRunbookMessage] = useState(missingRunbookType === alertType);

  const handleDismissMissingRunbookMessage = useCallback(() => {
    urlSearchParams.delete('runbookMissing');
    const newParams = urlSearchParams.toString();
    const newUrl = `${window.location.pathname}${newParams ? '?' + newParams : ''}`;
    window.history.replaceState({}, '', newUrl);
    setShowMissingRunbookMessage(false);
  }, [urlSearchParams]);

  return (
    <>
      {showMissingRunbookMessage && (
        <Alert title="Runbook URL not configured" severity="warning" onRemove={handleDismissMissingRunbookMessage}>
          The runbook URL for this alert was not found. You can configure it below.
        </Alert>
      )}
      <Stack direction="row" alignItems="center" gap={1}>
        <Text variant="bodySmall">Runbook URL (optional): </Text>
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
                width={35}
              />
            )}
          />
        </InlineField>
      </Stack>
    </>
  );
};
