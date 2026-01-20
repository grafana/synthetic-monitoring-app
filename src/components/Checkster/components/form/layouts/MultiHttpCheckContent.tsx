import React from 'react';

import { SectionContent } from '../../ui/SectionContent';
import { FormFolderField } from '../FormFolderField';
import { FormJobField } from '../FormJobField';
import { FormMultiHttpEntriesField } from '../FormMultiHttpEntriesField';

// Any field path that belongs to the multi http check section
export const MULTI_HTTP_CHECK_REG_EXP_LIST = ['job', /\.entries\.\d+\.request/, /\.entries\.\d+\.variables/];

export function MultiHttpCheckContent() {
  return (
    <SectionContent>
      <FormJobField field="job" />
      <FormFolderField />
      <FormMultiHttpEntriesField field="settings.multihttp.entries" />
    </SectionContent>
  );
}
