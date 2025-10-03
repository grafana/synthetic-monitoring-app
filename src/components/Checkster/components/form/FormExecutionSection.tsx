import React from 'react';

import { FormSectionName } from '../../types';

import { GenericExecutionSection } from './layouts/GenericExecutionSection';
import { FormSection } from './FormSection';

export function FormExecutionSection() {
  return (
    <FormSection sectionName={FormSectionName.Execution} fields={['probes']}>
      <GenericExecutionSection />
    </FormSection>
  );
}
