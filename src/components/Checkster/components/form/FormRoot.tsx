import React from 'react';
import { Stack } from '@grafana/ui';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { FormAlertingSection } from './FormAlertingSection';
import { FormCheckSection } from './FormCheckSection';
import { FormExecutionSection } from './FormExecutionSection';
import { FormLabelSection } from './FormLabelSection';
import { FormUptimeSection } from './FormUptimeSection';

export function FormRoot() {
  const { formId } = useChecksterContext();
  return (
    <form id={formId}>
      <Stack gap={1} direction="column">
        <FormCheckSection />

        <FormUptimeSection />

        <FormLabelSection />

        <FormExecutionSection />

        <FormAlertingSection />
      </Stack>
    </form>
  );
}
