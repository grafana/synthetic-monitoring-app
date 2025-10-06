import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { css } from '@emotion/css';

import { Check, CheckFormValues } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { toPayload } from '../../utils/adaptors';
import { AlertingSection } from './sections/AlertingSection';
import { CheckSection } from './sections/CheckSection';
import { ExecutionSection } from './sections/ExecutionSection';
import { LabelSection } from './sections/LabelSection';
import { UptimeSection } from './sections/UptimeSection';
import { FormFooter } from './FormFooter';

export function FormRoot({ onSave }: { onSave(payload: Check, formValues: CheckFormValues): Promise<void> }) {
  const {
    formId,
    formNavigation: { sectionByErrors, completeAllSteps },
  } = useChecksterContext();
  const {
    handleSubmit,
    formState: { submitCount },
  } = useFormContext<CheckFormValues>();

  useEffect(() => {
    if (submitCount > 0) {
      completeAllSteps(); // Tell nav that all step-time is over
    }
  }, [completeAllSteps, submitCount]);

  return (
    <form
      onSubmit={handleSubmit(
        (data) => {
          const check = toPayload(data);
          onSave(check, data);
        },
        (errors) => {
          sectionByErrors(errors);
        }
      )}
      className={css`
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
      `}
      id={formId}
    >
      <CheckSection />
      <UptimeSection />
      <LabelSection />
      <ExecutionSection />
      <AlertingSection />

      <FormFooter />
    </form>
  );
}
