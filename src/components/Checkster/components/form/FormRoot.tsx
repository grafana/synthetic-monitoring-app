import React, { useCallback, useEffect, useState } from 'react';
import { FieldErrors, useFormContext } from 'react-hook-form';
import { css } from '@emotion/css';

import { Check, CheckFormValues } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { toPayload } from '../../utils/adaptors';
import { getFlattenErrors, isFocusingError, onErrorFocusFallback } from '../../utils/form';
import { AlertingSection } from './sections/AlertingSection';
import { CheckSection } from './sections/CheckSection';
import { ExecutionSection } from './sections/ExecutionSection';
import { LabelSection } from './sections/LabelSection';
import { UptimeSection } from './sections/UptimeSection';
import { FormFooter } from './FormFooter';

const styles = {
  form: css`
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
  `,
};

export function FormRoot({
  onSave,
}: {
  onSave(payload: Check, formValues: CheckFormValues): Promise<Function | void>;
}) {
  const {
    formId,
    setIsSubmitting,
    formNavigation: { sectionByErrors, completeAllSteps },
  } = useChecksterContext();

  const {
    handleSubmit,
    reset,
    formState: { submitCount, isDirty, isSubmitting },
  } = useFormContext<CheckFormValues>();

  useEffect(() => {
    if (submitCount > 0) {
      completeAllSteps(); // Tell nav that all step-time is over
    }
  }, [completeAllSteps, submitCount]);

  const [onSaveCallback, setOnSaveCallback] = useState<Function | undefined>();

  // sync submitting state with parent context (mainly to disable form when submitting)
  // `isSubmitting is not
  useEffect(() => {
    setIsSubmitting(isSubmitting);
  }, [isSubmitting, setIsSubmitting]);

  // Handle after save callback
  // Wait for formState to be reset before calling onSave callback
  useEffect(() => {
    if (!isDirty && typeof onSaveCallback === 'function') {
      onSaveCallback();
    }
  }, [onSaveCallback, isDirty]);

  const onValid = useCallback(
    async (data: CheckFormValues) => {
      const check = toPayload(data);
      try {
        const callback = await onSave(check, data);
        reset(data);
        if (callback) {
          // To avoid potential race condition with requestAnimationFrame and state updates caused by `reset`
          // Faster than taking last position in event loop (useTimeout(cb, 0))
          setOnSaveCallback(() => callback);
        }
      } catch (_error) {
        // TODO: handle this
      }
    },
    [onSave, reset]
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<CheckFormValues>) => {
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
    <form onSubmit={handleSubmit(onValid, onInvalid)} className={styles.form} id={formId}>
      <CheckSection />
      <UptimeSection />
      <LabelSection />
      <ExecutionSection />
      <AlertingSection />

      <FormFooter />
    </form>
  );
}
