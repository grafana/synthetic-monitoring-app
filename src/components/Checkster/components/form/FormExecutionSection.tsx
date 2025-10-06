import React from 'react';

import { FormSectionName } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { GenericExecutionSection } from './layouts/GenericExecutionSection';
import { FormSection } from './FormSection';

const EXECUTION_SECTION_FIELDS = ['probes'];

export function FormExecutionSection() {
  const {
    checkMeta: { isK6Check },
  } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Execution} fields={EXECUTION_SECTION_FIELDS}>
      <GenericExecutionSection publishAdvancedMetrics={!isK6Check} />
    </FormSection>
  );
}
