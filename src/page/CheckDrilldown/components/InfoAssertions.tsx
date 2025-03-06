import React, { PropsWithChildren, useCallback } from 'react';
import { IconButton, Stack } from '@grafana/ui';

import { useCheckDrilldown } from 'page/CheckDrilldown/components/CheckDrilldownContext';

export const InfoAssertions = () => {
  return (
    <div>
      <Stack direction={`column`} gap={0.5}>
        <AssertionLine>
          WHEN <code>status code</code> is one of <code>200, 201, 302</code>{' '}
        </AssertionLine>
        <AssertionLine>
          AND <code>HTTP version</code> is <code>HTTP/1.0</code>
        </AssertionLine>
        <AssertionLine>
          AND <code>SSL</code> is <code>true</code>
        </AssertionLine>
        <AssertionLine>
          WITHIN <code>30s</code>
        </AssertionLine>
      </Stack>
    </div>
  );
};

const AssertionLine = ({ children }: PropsWithChildren) => {
  const { changeTab } = useCheckDrilldown();

  const handleClick = useCallback(() => {
    changeTab(0);
  }, [changeTab]);

  return (
    <Stack direction={`row`} justifyContent="space-between">
      <div>{children}</div>
      <IconButton name="eye" onClick={handleClick} tooltip="View insights for this assertion" />
    </Stack>
  );
};
