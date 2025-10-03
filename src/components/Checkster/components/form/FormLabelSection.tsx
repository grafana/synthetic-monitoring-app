import React from 'react';

import { FormSectionName } from '../../types';

import { GenericLabelSection } from './layouts/GenericLabelSection';
import { FormSection } from './FormSection';

export function FormLabelSection() {
  return (
    <FormSection sectionName={FormSectionName.Labels} fields={['labels']}>
      <GenericLabelSection />
    </FormSection>
  );
}
