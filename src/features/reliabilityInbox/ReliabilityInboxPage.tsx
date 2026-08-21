import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Feedback } from 'components/Feedback';

import { ReliabilityInboxReview } from './components/ReliabilityInboxReview';
import { SuggestionsRefreshControl } from './components/SuggestionsRefreshControl';
import { useReliabilityInboxSuggestions } from './data';
import { RELIABILITY_INBOX_CONTAINER, RELIABILITY_INBOX_PAGE_NAV } from './ReliabilityInboxPage.constants';

export { RELIABILITY_INBOX_PAGE_NAV };

export function ReliabilityInboxPageTitle() {
  return (
    <Stack alignItems="center" gap={1.5}>
      <Text element="h1">Check Suggestions</Text>
      <Feedback
        feature="reliability-inbox"
        placement="bottom-start"
        about={{ icon: 'ai-sparkle', text: 'Experimental' }}
      />
    </Stack>
  );
}

export function ReliabilityInboxPage() {
  const styles = useStyles2(getStyles);
  const suggestionsQuery = useReliabilityInboxSuggestions({ includeDismissed: true });

  return (
    <PluginPage
      actions={
        <SuggestionsRefreshControl
          generatedAt={suggestionsQuery.dataUpdatedAt || undefined}
          isFetching={suggestionsQuery.isFetching}
          onRefresh={() => void suggestionsQuery.refetch()}
        />
      }
      pageNav={RELIABILITY_INBOX_PAGE_NAV}
      renderTitle={() => <ReliabilityInboxPageTitle />}
    >
      <div className={styles.container}>
        <Stack direction="column" gap={2}>
          <Text element="p" color="secondary">
            Review monitoring gaps discovered from recent traffic.
          </Text>
          <ReliabilityInboxReview suggestionsQuery={suggestionsQuery} />
        </Stack>
      </div>
    </PluginPage>
  );
}

const getStyles = () => ({
  container: css({
    containerName: RELIABILITY_INBOX_CONTAINER,
    containerType: 'inline-size',
  }),
});
