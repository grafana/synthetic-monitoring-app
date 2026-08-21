import React, { useEffect, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackInboxExposure, trackReviewEntryClicked } from 'features/tracking/reliabilityInboxEvents';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { useCachedReliabilityInboxSuggestions } from './data';

const CONTAINER_NAME = 'reliabilityInboxBanner';

export function ReliabilityInboxBanner() {
  const styles = useStyles2(getStyles);
  const { data: opportunities = [] } = useCachedReliabilityInboxSuggestions();
  const exposureTracked = useRef(false);
  const topOpportunity = opportunities[0];
  const suggestionSummary = `${opportunities.length} ${
    opportunities.length === 1 ? 'suggestion is' : 'suggestions are'
  } ready to review · turn traffic signals into proactive monitoring`;

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
    <div className={styles.container}>
      <section className={styles.banner}>
        <div className={styles.layout}>
          <div className={styles.message}>
            <span className={styles.icon} aria-hidden="true">
              <Icon name="ai-sparkle" size="xl" />
            </span>
            <Stack direction="column" alignItems="flex-start" gap={2}>
              <Text element="h2" weight="medium">
                Check Suggestions
              </Text>
              <Text element="p" variant="h5" color="secondary">
                {topOpportunity
                  ? suggestionSummary
                  : 'Generate actionable recommendations when you are ready to review them.'}
              </Text>
            </Stack>
          </div>
          <LinkButton
            className={styles.action}
            icon="ai-sparkle"
            variant="secondary"
            href={generateRoutePath(AppRoutes.ReliabilityInbox)}
            onClick={() => {
              if (topOpportunity) {
                trackReviewEntryClicked({ opportunityId: topOpportunity.id });
              }
            }}
          >
            {topOpportunity ? 'Review suggestions' : 'Generate suggestions'}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    containerName: CONTAINER_NAME,
    containerType: 'inline-size',
  }),
  banner: css({
    label: 'reliability-inbox-banner',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    minHeight: theme.spacing(16.5),
    overflow: 'hidden',
    padding: theme.spacing(3),
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: `linear-gradient(110deg, rgba(168, 85, 247, 0.08), transparent 44%), ${theme.colors.background.secondary}`,
    boxShadow: theme.shadows.z1,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '0 auto 0 0',
      width: 4,
      background: 'linear-gradient(180deg, rgb(168, 85, 247), rgb(249, 115, 22))',
    },
    [`@container ${CONTAINER_NAME} (max-width: ${theme.breakpoints.values.sm}px)`]: {
      minHeight: 'auto',
      padding: theme.spacing(2.5),
    },
  }),
  layout: css({
    label: 'reliability-inbox-banner-layout',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
    width: '100%',
  }),
  message: css({
    label: 'reliability-inbox-banner-message',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flex: '1 1 420px',
    minWidth: 0,
  }),
  icon: css({
    label: 'reliability-inbox-banner-icon',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.spacing(6.5),
    height: theme.spacing(6.5),
    flexShrink: 0,
    color: theme.colors.text.primary,
    background: 'rgba(168, 85, 247, 0.12)',
    borderRadius: '50%',
  }),
  action: css({
    label: 'reliability-inbox-banner-action',
    minHeight: theme.spacing(5.75),
    [`@container ${CONTAINER_NAME} (max-width: ${theme.breakpoints.values.sm}px)`]: {
      width: '100%',
      justifyContent: 'center',
    },
  }),
});
