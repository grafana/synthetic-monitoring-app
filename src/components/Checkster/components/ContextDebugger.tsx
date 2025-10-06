import React from 'react';
import { Stack } from '@grafana/ui';

import { Preformatted } from '../../Preformatted';
import { useChecksterContext } from '../contexts/ChecksterContext';

export function ContextDebugger() {
  const context = useChecksterContext();

  return (
    <Stack direction="column" gap={2}>
      <Preformatted>{JSON.stringify(context.check)}</Preformatted>
      <Preformatted>{JSON.stringify(context.checkMeta)}</Preformatted>
    </Stack>
  );
}
