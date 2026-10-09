import React from 'react';
import { useAssistant } from '@grafana/assistant';
import { Button, EmptyState, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Feedback } from 'components/Feedback';
import { SyntheticsTab } from 'page/SyntheticsPageNav';
import { SyntheticsPluginPage } from 'page/SyntheticsPluginPage';

import { ReliabilityInboxReview } from './components/ReliabilityInboxReview';
import { SuggestionsRefreshControl } from './components/SuggestionsRefreshControl';
import { useReliabilityInboxSuggestions } from './data';
import { ASSISTANT_ORIGIN, RELIABILITY_INBOX_CONTAINER } from './ReliabilityInboxPage.constants';

export function ReliabilityInboxPageTitle() {
  return (
    <Stack alignItems="center" gap={1.5}>
      <Text element="h2">Check Suggestions</Text>
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
    <SyntheticsPluginPage activeTab={SyntheticsTab.CheckSuggestions}>
      <div className={styles.container}>
        <Stack direction="column" gap={2}>
          <Stack alignItems="center" justifyContent="space-between" gap={2} wrap="wrap">
            <ReliabilityInboxPageTitle />
            {!suggestionsQuery.aiRequired && (
              <SuggestionsRefreshControl
                generatedAt={suggestionsQuery.dataUpdatedAt || undefined}
                isFetching={suggestionsQuery.isFetching}
                onRefresh={() => void suggestionsQuery.refetch()}
              />
            )}
          </Stack>
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
    </SyntheticsPluginPage>
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
