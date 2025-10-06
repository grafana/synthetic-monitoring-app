import React from 'react';

import { FormSectionName } from '../../types';

import { GenericAlertingSection } from './layouts/GenericAlertingSection';
import { FormSection } from './FormSection';

export function FormAlertingSection() {
  return (
    <FormSection sectionName={FormSectionName.Alerting}>
      <GenericAlertingSection />
    </FormSection>
  );
}
