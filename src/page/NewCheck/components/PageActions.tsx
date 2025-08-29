import React from 'react';
import { Stack } from '@grafana/ui';
import { DataTestIds } from 'test/dataTestIds';

import { FormSubmitButton } from 'components/CheckEditor/FormSubmitButton';
import { FormTestButton } from 'components/CheckEditor/FormTestButton';

export function PageActions() {
  return (
    <Stack data-testid={DataTestIds.PAGE_ACTIONS}>
      <FormTestButton />
      <FormSubmitButton />
    </Stack>
  );
}
