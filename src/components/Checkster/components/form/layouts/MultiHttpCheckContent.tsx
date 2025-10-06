import React from 'react';

import { SectionContent } from '../../ui/SectionContent';
import { FormJobField } from '../FormJobField';
import { FormMultiHttpEntriesField } from '../FormMultiHttpEntriesField';

// Any field path that belongs to the multi http check section
export const MULTI_HTTP_CHECK_REG_EXP_LIST = [/\.multihttp\.entries\.\d+\.request/];

export function MultiHttpCheckContent() {
  return (
    <SectionContent label="Requests">
      <FormJobField field="job" />
      <FormMultiHttpEntriesField field="settings.multihttp.entries" />
    </SectionContent>
  );
}
