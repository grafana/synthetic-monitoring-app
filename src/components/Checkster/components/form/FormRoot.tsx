import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FieldErrors, useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { Check, CheckFormValues } from 'types';
import { AlertingConfirmationRequired, CheckAlertingSaveError } from 'data/alertSetupRecovery';
import { useLabelMode } from 'data/useLabelMode';
import { useNotificationRouting } from 'data/useNotificationRouting';
import { OverLimitAlert } from 'components/OverLimitAlert';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { toPayload } from '../../utils/adaptors';
import { getFlattenErrors, isFocusingError, onErrorFocusFallback } from '../../utils/form';
import { AlertingSection } from './sections/AlertingSection';
import { CheckSection } from './sections/CheckSection';
import { ExecutionSection } from './sections/ExecutionSection';
import { LabelSection } from './sections/LabelSection';
import { UptimeSection } from './sections/UptimeSection';
import { AlertingSaveDialog } from './AlertingSaveDialog';
import { FormFooter } from './FormFooter';

export function FormRoot({
  onSave,
}: {
  onSave(payload: Check, formValues: CheckFormValues): Promise<Function | void>;
}) {
  const styles = useStyles2(getStyles);
  // Start routing inspection on the first step so Alerting usually opens ready.
  useNotificationRouting();
  useLabelMode();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    formId,
    formNavigation: { sectionByErrors, completeAllSteps },
    isNew,
    checkType,
  } = useChecksterContext();

  const {
    handleSubmit,
    reset,
    formState: { submitCount, isDirty },
  } = useFormContext<CheckFormValues>();

  useEffect(() => {
    if (submitCount > 0) {
      completeAllSteps(); // Tell nav that all step-time is over
    }
  }, [completeAllSteps, submitCount]);

  const [onSaveCallback, setOnSaveCallback] = useState<Function | undefined>();

  // Handle after save callback
  // Wait for formState to be reset before calling onSave callback
  useEffect(() => {
    if (!isDirty && typeof onSaveCallback === 'function') {
      onSaveCallback();
    }
  }, [onSaveCallback, isDirty]);

  const [saveError, setSaveError] = useState<unknown | undefined>(undefined);
  const [resolvingAlerting, setResolvingAlerting] = useState(false);
  const submittedValues = useRef<CheckFormValues | undefined>(undefined);
  const resolveAlerting = async (action: () => Promise<Function | void>) => {
    setResolvingAlerting(true);
    try {
      const callback = await action();
      reset(submittedValues.current);
      setSaveError(undefined);
      if (callback) {
        setOnSaveCallback(() => callback);
      }
    } catch (error) {
      setSaveError(error);
    } finally {
      setResolvingAlerting(false);
    }
  };

  const onValid = useCallback(
    async (data: CheckFormValues) => {
      submittedValues.current = data;
      const check = toPayload(data);
      try {
        const callback = await onSave(check, data);
        reset(data);
        if (callback) {
          // To avoid potential race condition with requestAnimationFrame and state updates caused by `reset`
          // Faster than taking last position in event loop (useTimeout(cb, 0))
          setOnSaveCallback(() => callback);
        }
        setSaveError(undefined);
      } catch (error: unknown) {
        setSaveError(error);
      }
    },
    [onSave, reset]
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<CheckFormValues>) => {
      setSaveError(undefined);
      sectionByErrors(errors);
      // Check that we have a focus on an error, if not, try to focus with use of `data-form-name`
      setTimeout(() => {
        const errorList = getFlattenErrors(errors);
        if (!isFocusingError(errorList)) {
          onErrorFocusFallback(errorList);
        }
      }, 0);
    },
    [sectionByErrors]
  );

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(onValid, onInvalid)}
      className={styles.form}
      id={formId}
      data-testid={CHECKSTER_TEST_ID.form.root}
    >
      {isNew && (
        <div className={styles.alertContainer}>
          <OverLimitAlert checkType={checkType} />
        </div>
      )}
      {saveError instanceof AlertingConfirmationRequired || saveError instanceof CheckAlertingSaveError ? (
        <AlertingSaveDialog
          error={saveError}
          busy={resolvingAlerting}
          onAction={resolveAlerting}
          onCancel={() => setSaveError(undefined)}
        />
      ) : (
        !!saveError && (
          <Alert
            className={styles.alertContainer}
            title="Save failed"
            severity="error"
            buttonContent="Retry"
            onRemove={() => {
              formRef.current?.requestSubmit();
            }}
          >
            {saveError &&
            typeof saveError === 'object' &&
            'message' in saveError &&
            typeof saveError.message === 'string'
              ? saveError.message
              : 'It was not possible to save check.'}
          </Alert>
        )
      )}

      <CheckSection />
      <UptimeSection />
      <LabelSection />
      <ExecutionSection />
      <AlertingSection />

      <FormFooter />
    </form>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    form: css`
      display: flex;
      flex-direction: column;
      flex: 1 1 0;
    `,
    alertContainer: css`
      flex-grow: 0;
      margin: ${theme.spacing(2, 1, 0, 2)};
    `,
  };
}
