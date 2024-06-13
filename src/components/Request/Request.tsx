import React, { ReactNode } from 'react';
import { Stack } from '@grafana/ui';

export const Request = ({ children }: { children: ReactNode }) => {
  return (
    <Stack direction={`column`} gap={2}>
      {children}
    </Stack>
  );
};
