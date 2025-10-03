import React from 'react';

import { SectionContent } from '../../ui/SectionContent';
import { GenericFrequencyField } from '../generic/GenericFrequencyField';
import { GenericProbesSelectField } from '../generic/GenericProbesSelectField';

export function GenericExecutionSection() {
  return (
    <SectionContent>
      <GenericProbesSelectField />
      <GenericFrequencyField />
    </SectionContent>
  );
}
