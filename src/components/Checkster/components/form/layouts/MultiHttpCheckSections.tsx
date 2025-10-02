import React from 'react';
import { Stack } from '@grafana/ui';

import { FIELD_SPACING } from '../../../constants';
import { FormJobField } from '../FormJobField';
import { FormMultiHttpEntriesField } from '../FormMultiHttpEntriesField';

export function MultiHttpCheckSections() {
  return (
    <>
      <h2>Requests</h2>
      <Stack direction="column" gap={FIELD_SPACING}>
        <FormJobField field="job" />
        <FormMultiHttpEntriesField field="settings.multihttp.entries" />
      </Stack>
    </>
  );
}
