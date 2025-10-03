import React from 'react';
import { css } from '@emotion/css';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { FormAlertingSection } from './FormAlertingSection';
import { FormCheckSection } from './FormCheckSection';
import { FormExecutionSection } from './FormExecutionSection';
import { FormLabelSection } from './FormLabelSection';
import { FormUptimeSection } from './FormUptimeSection';

export function FormRoot() {
  const { formId } = useChecksterContext();
  return (
    <form
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
    </form>
  );
}
