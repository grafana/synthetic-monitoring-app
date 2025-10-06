import React from 'react';

import { FormSectionName } from '../../types';

import { GenericLabelSection } from './layouts/GenericLabelSection';
import { FormSection } from './FormSection';

export const LABEL_SECTION_FIELDS = ['labels'];

export function FormLabelSection() {
  return (
    <FormSection sectionName={FormSectionName.Labels} fields={LABEL_SECTION_FIELDS}>
      <GenericLabelSection />
    </FormSection>
  );
}
