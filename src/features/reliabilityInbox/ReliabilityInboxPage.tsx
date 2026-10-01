import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { PluginPage } from '@grafana/runtime';
import { Button, EmptyState, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Feedback } from 'components/Feedback';

import { ReliabilityInboxReview } from './components/ReliabilityInboxReview';
import { SuggestionsRefreshControl } from './components/SuggestionsRefreshControl';
import { useReliabilityInboxSuggestions } from './data';
import {
  ASSISTANT_ORIGIN,
  RELIABILITY_INBOX_CONTAINER,
  RELIABILITY_INBOX_PAGE_NAV,
} from './ReliabilityInboxPage.constants';

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
        suggestionsQuery.aiRequired ? undefined : (
          <SuggestionsRefreshControl
            generatedAt={suggestionsQuery.dataUpdatedAt || undefined}
            isFetching={suggestionsQuery.isFetching}
            onRefresh={() => void suggestionsQuery.refetch()}
          />
        )
      }
      pageNav={RELIABILITY_INBOX_PAGE_NAV}
      renderTitle={() => <ReliabilityInboxPageTitle />}
    >
      <div className={styles.container}>
        <Stack direction="column" gap={2}>
          <Text element="p" color="secondary">
            Review monitoring gaps discovered from recent traffic.
          </Text>
          {suggestionsQuery.aiRequired ? (
            <AssistantRequired />
          ) : (
            <ReliabilityInboxReview suggestionsQuery={suggestionsQuery} />
          )}
        </Stack>
      </div>
    </PluginPage>
  );
}

// Opening Assistant is where an admin accepts its AI terms; once accepted, the
// page generates suggestions without a reload.
function AssistantRequired() {
  const { isAvailable, openAssistant } = useAssistant();

  return (
    <EmptyState
      variant="call-to-action"
      message="Check Suggestions needs Grafana Assistant"
      button={
        isAvailable && openAssistant ? (
          <Button icon="ai-sparkle" onClick={() => openAssistant({ origin: ASSISTANT_ORIGIN })}>
            Open Assistant
          </Button>
        ) : undefined
      }
    >
      Suggestions are ranked with AI, so they are only available when Grafana Assistant is enabled and an admin has
      accepted its terms.
    </EmptyState>
  );
}

const getStyles = () => ({
  container: css({
    containerName: RELIABILITY_INBOX_CONTAINER,
    containerType: 'inline-size',
  }),
});
