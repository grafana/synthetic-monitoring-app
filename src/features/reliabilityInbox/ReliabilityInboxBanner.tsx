import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Icon, LinkButton, Stack, Text } from '@grafana/ui';
import { trackInboxExposure, trackReviewEntryClicked } from 'features/tracking/reliabilityInboxEvents';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { useCachedReliabilityInboxSuggestions } from './data';
import { compareReliabilityOpportunities } from './model';

export function ReliabilityInboxBanner() {
  const { data: opportunities = [] } = useCachedReliabilityInboxSuggestions();
  const exposureTracked = useRef(false);
  const topOpportunity = useMemo(() => [...opportunities].sort(compareReliabilityOpportunities)[0], [opportunities]);

  useEffect(() => {
    if (!topOpportunity || exposureTracked.current) {
      return;
    }

    exposureTracked.current = true;
    trackInboxExposure({
      opportunityCount: opportunities.length,
      topOpportunityId: topOpportunity.id,
    });
  }, [opportunities.length, topOpportunity]);

  return (
    <Box
      element="section"
      aria-label="Reliability Inbox"
      paddingY={1}
      paddingX={2}
      borderStyle="solid"
      borderColor="medium"
      borderRadius="default"
      backgroundColor="secondary"
    >
      <Stack alignItems="center" justifyContent="space-between" gap={2} wrap="wrap">
        <Stack alignItems="center" gap={1}>
          <Icon name="ai-sparkle" aria-hidden="true" />
          <Stack direction="column" alignItems="flex-start" gap={0.25}>
            <Text weight="bold">
              {topOpportunity
                ? `Reliability Inbox · ${opportunities.length} ${opportunities.length === 1 ? 'opportunity' : 'opportunities'}`
                : 'Reliability Inbox'}
            </Text>
            <Text color="secondary" variant="bodySmall">
              {topOpportunity
                ? `Highest priority: ${topOpportunity.subject}`
                : 'Generate prioritized suggestions when you are ready to review them.'}
            </Text>
          </Stack>
        </Stack>
        <LinkButton
          icon="ai-sparkle"
          variant="secondary"
          href={generateRoutePath(AppRoutes.ReliabilityInbox)}
          onClick={() => {
            if (topOpportunity) {
              trackReviewEntryClicked({
                opportunityId: topOpportunity.id,
                checkType: topOpportunity.proposedCheck.checkType,
              });
            }
          }}
        >
          Review suggestions
        </LinkButton>
      </Stack>
    </Box>
  );
}
