import React from 'react';

import { FormSectionName } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { GenericExecutionSection } from './layouts/GenericExecutionSection';
import { FormSection } from './FormSection';

export function FormExecutionSection() {
  const {
    checkMeta: { isK6Check },
  } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Execution} fields={['probes']}>
      <GenericExecutionSection publishAdvancedMetrics={!isK6Check} />
    </FormSection>
  );
}
