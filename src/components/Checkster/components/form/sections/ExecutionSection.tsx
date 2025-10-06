import React from 'react';

import { FormSectionName } from '../../../types';

import { useChecksterContext } from '../../../contexts/ChecksterContext';
import { FormSection } from '../FormSection';
import { GenericExecutionContent } from '../layouts/GenericExecutionContent';

const EXECUTION_SECTION_FIELDS = ['probes'];

export function ExecutionSection() {
  const {
    checkMeta: { isK6Check },
  } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Execution} fields={EXECUTION_SECTION_FIELDS}>
      <GenericExecutionContent publishAdvancedMetrics={!isK6Check} />
    </FormSection>
  );
}
