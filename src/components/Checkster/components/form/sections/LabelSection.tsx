import React from 'react';

import { FormSectionName } from '../../../types';

import { FormSection } from '../FormSection';
import { GenericLabelContent } from '../layouts/GenericLabelContent';

export const LABEL_SECTION_FIELDS = ['labels'];

export function LabelSection() {
  return (
    <FormSection sectionName={FormSectionName.Labels} fields={LABEL_SECTION_FIELDS}>
      <GenericLabelContent />
    </FormSection>
  );
}
