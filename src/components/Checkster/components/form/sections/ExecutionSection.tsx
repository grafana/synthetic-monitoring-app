import React from 'react';

import { FormSectionName } from '../../../types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { FormSection } from '../FormSection';
import { GenericExecutionContent } from '../layouts/GenericExecutionContent';

const DEFAULT_EXECUTION_FIELDS = ['probes', 'frequency'];

export function ExecutionSection() {
  const { isK6Check } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Execution} fields={DEFAULT_EXECUTION_FIELDS}>
      <GenericExecutionContent publishAdvancedMetrics={!isK6Check} />
    </FormSection>
  );
}
