import React, { useEffect, useId, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, Checkbox, FieldValidationMessage, useStyles2 } from '@grafana/ui';
import { trackSelectAlert, trackUnSelectAlert } from 'features/tracking/perCheckAlertsEvents';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckAlertType, CheckFormValuesWithAlert } from 'types';
import { useURLSearchParams } from 'hooks/useURLSearchParams';
import { NotOkStatusInfo } from 'components/AlertStatus/NotOkStatusInfo';

import { AlertCondition } from './AlertCondition';
import { PredefinedAlertInterface } from './AlertsPerCheck.constants';
import { getAlertItemStyles } from './AlertsPerCheck.styles';
import { NotificationRoutingSummary } from './NotificationRoutingSummary';
import { RunbookUrl } from './RunbookUrl';

export const AlertItem = ({
  alert,
  selected,
  onSelectionChange,
}: {
  alert: PredefinedAlertInterface;
  selected: boolean;
  onSelectionChange: (type: CheckAlertType) => void;
}) => {
  const styles = useStyles2(getAlertItemStyles);
  const { getValues, formState } = useFormContext<CheckFormValuesWithAlert<typeof alert.type>>();
  const searchParams = useURLSearchParams();
  const [showRunbook, setShowRunbook] = useState(searchParams.get('runbookMissing') === alert.type);
  const runbookId = useId();
  const status = getValues(`alerts.${alert.type}.status`);
  const creationError = getValues(`alerts.${alert.type}.creationError`);
  const selectionError = formState.errors.alerts?.[alert.type]?.isSelected?.message;
  const runbookError = formState.errors.alerts?.[alert.type]?.runbookUrl?.message;
  const runbookUrl = getValues('alerts')?.[alert.type]?.runbookUrl;
  const hasRunbook = Boolean(runbookUrl?.trim());
  const runbookAction = showRunbook ? 'Hide runbook' : hasRunbook ? 'Edit runbook' : 'Add runbook';
  const errorId = `alert-selection-error-${alert.type}`;

  // Open only the alert whose hidden field needs attention.
  useEffect(() => {
    if (runbookError) {
      setShowRunbook(true);
    }
  }, [runbookError, formState.submitCount]);

  return (
    <div role="group" aria-label={alert.category} className={styles.alert}>
      <div className={styles.header}>
        <Checkbox
          label={alert.category}
          className={styles.checkbox}
          aria-describedby={selectionError ? errorId : undefined}
          invalid={!!selectionError}
          id={`alert-${alert.type}`}
          data-testid={CHECKSTER_TEST_ID.feature.perCheckAlerts[alert.type].selectedCheckbox}
          checked={selected}
          disabled={formState.disabled}
          onChange={() => {
            onSelectionChange(alert.type);
            (selected ? trackUnSelectAlert : trackSelectAlert)({ name: alert.type });
          }}
        />
        {status && status !== 'OK' && (
          <div className={styles.alertStatus} data-testid={`alert-error-status-${alert.type}`}>
            <NotOkStatusInfo status={status} error={creationError} />
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fill="outline"
          icon={showRunbook ? 'angle-up' : hasRunbook ? undefined : 'plus'}
          aria-label={`${runbookAction} for ${alert.category}`}
          aria-expanded={showRunbook}
          aria-controls={runbookId}
          onClick={() => setShowRunbook(!showRunbook)}
          className={styles.runbookToggle}
        >
          {runbookAction}
        </Button>
      </div>
      <div className={styles.body}>
        {selectionError && <FieldValidationMessage id={errorId}>{selectionError}</FieldValidationMessage>}
        <AlertCondition alert={alert} selected={selected} />
        {showRunbook && (
          <div id={runbookId} role="region" aria-label={`${alert.category} runbook`} className={styles.runbook}>
            <RunbookUrl alertType={alert.type} selected={selected} disabled={formState.disabled} />
          </div>
        )}
      </div>
      {selected && (
        <div className={styles.footer}>
          <NotificationRoutingSummary alert={alert} />
        </div>
      )}
    </div>
  );
};
