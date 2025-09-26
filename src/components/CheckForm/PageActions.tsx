import React from 'react';
import { Stack } from '@grafana/ui';

import { DataTestIds } from '../../test/dataTestIds';
import { FormSubmitButton } from './FormLayout/FormSubmitButton';
import { FormTestButton } from './FormLayout/FormTestButton';

export function PageActions() {
  return (
    <Stack data-testid={DataTestIds.PAGE_ACTIONS}>
      <FormTestButton />
      <FormSubmitButton />
    </Stack>
  );
}
