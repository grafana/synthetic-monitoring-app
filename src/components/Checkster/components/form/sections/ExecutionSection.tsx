import React from 'react';

import { FormSectionName } from '../../../types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { FormSection } from '../FormSection';
import { GenericExecutionContent } from '../layouts/GenericExecutionContent';

const defaultExecutionFields = ['probes', 'frequency'];

export function ExecutionSection() {
  const { isK6Check } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Execution} fields={defaultExecutionFields}>
      <GenericExecutionContent publishAdvancedMetrics={!isK6Check} />
    </FormSection>
  );
}
