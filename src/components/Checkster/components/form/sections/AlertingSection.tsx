import React from 'react';

import { FormSectionName } from '../../../types';

import { FormSection } from '../FormSection';
import { GenericAlertingContent } from '../layouts/GenericAlertingContent';

const defaultAlertingFields = ['alerts'];

export function AlertingSection() {
  return (
    <FormSection sectionName={FormSectionName.Alerting} fields={defaultAlertingFields}>
      <GenericAlertingContent />
    </FormSection>
  );
}
