import React from 'react';

import { GenericFrequencyField } from '../generic/GenericFrequencyField';
import { GenericProbesSelectField } from '../generic/GenericProbesSelectField';

export function GenericExecutionSection() {
  return (
    <>
      <h2>Execution</h2>
      <GenericProbesSelectField />
      <GenericFrequencyField />
    </>
  );
}
