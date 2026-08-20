import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { Badge, Stack, Text } from '@grafana/ui';

import { ReliabilityInboxReview } from './components/ReliabilityInboxReview';
import { RELIABILITY_INBOX_PAGE_NAV } from './ReliabilityInboxPage.constants';

export { RELIABILITY_INBOX_PAGE_NAV };

export function ReliabilityInboxPage() {
  return (
    <PluginPage
      pageNav={RELIABILITY_INBOX_PAGE_NAV}
      renderTitle={() => (
        <Stack alignItems="center" gap={1.5}>
          <h1>Reliability Inbox</h1>
          <Badge color="blue" icon="ai-sparkle" text="Experimental" />
        </Stack>
      )}
    >
      <Stack direction="column" gap={2}>
        <Text element="p" color="secondary">
          Review monitoring gaps discovered from recent traffic.
        </Text>
        <ReliabilityInboxReview />
      </Stack>
    </PluginPage>
  );
}
