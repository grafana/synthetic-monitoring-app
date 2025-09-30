import React from 'react';

import { FormSectionName } from '../../types';
import { CheckType } from 'types';

import { useChecksterContext } from '../../contexts/ChecksterContext';
import { HttpUptimeSection } from './layouts/HttpUptimeSection';
import { FormSection } from './FormSection';

export function FormUptimeSection() {
  const {
    checkMeta: { type },
  } = useChecksterContext();

  return (
    <FormSection sectionName={FormSectionName.Uptime}>
      <h2>Uptime</h2>
      {type === CheckType.HTTP && <HttpUptimeSection />}
    </FormSection>
  );
}
