import React from 'react';

import { FormSectionName } from '../../../types';

import { FormSection } from '../FormSection';
import { GenericAlertingContent } from '../layouts/GenericAlertingContent';

const DEFAULT_ALERTING_FIELDS = ['alerts'];

export function AlertingSection() {
  return (
    <FormSection sectionName={FormSectionName.Alerting} fields={DEFAULT_ALERTING_FIELDS}>
      <GenericAlertingContent />
    </FormSection>
  );
}
