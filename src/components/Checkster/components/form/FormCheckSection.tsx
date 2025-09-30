import React from 'react';

import { CheckType } from '../../../../types';
import { FormSectionName } from '../../types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { HttpCheckSection } from './layouts/HttpCheckSection';
import { FormSection } from './FormSection';

export function FormCheckSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();
  return (
    <FormSection sectionName={FormSectionName.Check}>{type === CheckType.HTTP && <HttpCheckSection />}</FormSection>
  );
}
