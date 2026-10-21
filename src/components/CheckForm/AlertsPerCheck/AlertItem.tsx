import React, { useEffect, useId, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Button, Checkbox, FieldValidationMessage, useStyles2 } from '@grafana/ui';
import { trackSelectAlert, trackUnSelectAlert } from 'features/tracking/perCheckAlertsEvents';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckAlertType, CheckFormValues } from 'types';
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
  const { getValues, clearErrors, setFocus, watch, formState } = useFormContext<CheckFormValues>();
  const searchParams = useURLSearchParams();
  const runbookField = `alerts.${alert.type}.runbookUrl` as const;
  const runbookUrl = watch(runbookField);
  const [showRunbook, setShowRunbook] = useState(
    Boolean(runbookUrl) || searchParams.get('runbookMissing') === alert.type
  );
  const addRunbookRef = useRef<HTMLButtonElement>(null);
  const focusRunbookControl = useRef(false);
  const runbookId = useId();
  const status = getValues(`alerts.${alert.type}.status`);
  const creationError = getValues(`alerts.${alert.type}.creationError`);
  const selectionError = formState.errors.alerts?.[alert.type]?.isSelected?.message;
  const runbookError = formState.errors.alerts?.[alert.type]?.runbookUrl?.message;
  const errorId = `alert-selection-error-${alert.type}`;

  // Include saved URLs loaded after the card mounts and fields needing attention.
  useEffect(() => {
    if (runbookUrl || runbookError) {
      setShowRunbook(true);
    }
  }, [runbookUrl, runbookError]);

  useEffect(() => {
    if (focusRunbookControl.current) {
      if (showRunbook) {
        setFocus(runbookField);
      } else {
        addRunbookRef.current?.focus();
      }
      focusRunbookControl.current = false;
    }
  }, [showRunbook, runbookField, setFocus]);

  const removeRunbook = () => {
    clearErrors(runbookField);
    focusRunbookControl.current = true;
    setShowRunbook(false);
  };

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
        {!showRunbook && (
          <Button
            ref={addRunbookRef}
            type="button"
            variant="secondary"
            size="sm"
            fill="outline"
            icon="plus"
            tooltip="Add a link to instructions for investigating and resolving this alert."
            aria-label={`Add runbook for ${alert.category}`}
            disabled={!selected || formState.disabled}
            onClick={() => {
              focusRunbookControl.current = true;
              setShowRunbook(true);
            }}
            className={styles.addRunbook}
          >
            Add runbook
          </Button>
        )}
      </div>
      <div className={styles.body}>
        {selectionError && <FieldValidationMessage id={errorId}>{selectionError}</FieldValidationMessage>}
        <AlertCondition alert={alert} selected={selected} />
        {showRunbook && (
          <div id={runbookId} role="region" aria-label={`${alert.category} runbook`} className={styles.runbook}>
            <RunbookUrl
              alertType={alert.type}
              selected={selected}
              disabled={formState.disabled}
              onRemove={removeRunbook}
            />
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
