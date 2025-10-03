import React from 'react';

import { SectionContent } from '../../ui/SectionContent';
import { FormJobField } from '../FormJobField';
import { FormMultiHttpEntriesField } from '../FormMultiHttpEntriesField';

// Any field path that belongs to the multi http check section
export const MULTI_HTTP_CHECK_REG_EXP_LIST = [/\.multihttp\.entries\.\d+\.request/];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function MultiHttpCheckSections({ label }: { label: string }) {
  return (
    <SectionContent label={label}>
      <FormJobField field="job" />
      <FormMultiHttpEntriesField field="settings.multihttp.entries" />
    </SectionContent>
  );
}
