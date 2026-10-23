import React, { useCallback, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Alert, Field, IconButton, Input, useStyles2 } from '@grafana/ui';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckAlertType, CheckFormValues } from 'types';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

import { getAlertItemStyles } from './AlertsPerCheck.styles';

interface RunbookUrlProps {
  alertType: CheckAlertType;
  selected: boolean;
  disabled?: boolean;
  onRemove: () => void;
}

export const RunbookUrl = ({ alertType, selected, disabled = false, onRemove }: RunbookUrlProps) => {
  const styles = useStyles2(getAlertItemStyles);
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

  const { field } = useController({ control, name: `alerts.${alertType}.runbookUrl` });

  return (
    <>
      {showMissingRunbookMessage && (
        <Alert title="Runbook URL not configured" severity="warning" onRemove={handleDismissMissingRunbookMessage}>
          The runbook URL for this alert was not found. You can configure it below.
        </Alert>
      )}
      <Field
        label="Runbook URL (optional)"
        description="Link to instructions for investigating and resolving this alert."
        htmlFor={`alert-runbook-url-${alertType}`}
        invalid={!!runbookUrlError}
        error={runbookUrlError}
        disabled={!selected || disabled}
        noMargin
      >
        <>
          <div className={styles.runbookRow}>
            <Input
              {...field}
              value={field.value ?? ''}
              id={`alert-runbook-url-${alertType}`}
              data-testid={CHECKSTER_TEST_ID.feature.perCheckAlerts[alertType].runbookUrlInput}
              placeholder="https://example.com/runbook"
              className={styles.runbookInput}
            />
            <IconButton
              name="trash-alt"
              type="button"
              tooltip="Remove runbook"
              disabled={!selected || disabled}
              onClick={() => {
                field.onChange('');
                field.onBlur();
                if (showMissingRunbookMessage) {
                  handleDismissMissingRunbookMessage();
                }
                onRemove();
              }}
            />
          </div>
        </>
      </Field>
    </>
  );
};
