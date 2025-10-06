import React from 'react';

import { FormSectionName } from '../../../types';

import { FormSection } from '../FormSection';
import { GenericAlertingContent } from '../layouts/GenericAlertingContent';

export function AlertingSection() {
  return (
    <FormSection sectionName={FormSectionName.Alerting}>
      <GenericAlertingContent />
    </FormSection>
  );
}
