import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { css } from '@emotion/css';

import { CheckFormValues } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { FormAlertingSection } from './FormAlertingSection';
import { FormCheckSection } from './FormCheckSection';
import { FormExecutionSection } from './FormExecutionSection';
import { FormFooter } from './FormFooter';
import { FormLabelSection } from './FormLabelSection';
import { FormUptimeSection } from './FormUptimeSection';

export function FormRoot() {
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
        (...success) => {
          console.log('success');
          console.log(...success);
        },
        (errors) => {
          sectionByErrors(errors);
          console.log('error');
          console.log(errors);
        }
      )}
      className={css`
        display: flex;
        flex-direction: column;
        flex: 1 1 0;
      `}
      id={formId}
    >
      <FormCheckSection />
      <FormUptimeSection />
      <FormLabelSection />
      <FormExecutionSection />
      <FormAlertingSection />

      <FormFooter />
    </form>
  );
}
