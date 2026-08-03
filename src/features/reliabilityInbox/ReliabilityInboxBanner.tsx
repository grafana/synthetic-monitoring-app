import React, { useEffect, useMemo, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackInboxExposure, trackReviewEntryClicked } from 'features/tracking/reliabilityInboxEvents';

import { ReliabilityOpportunity } from './types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { ASSISTANT_ACTION_SIZE, ASSISTANT_GRADIENT, getAssistantActionStyle } from './assistantActionStyles';
import { useCachedReliabilityInboxSuggestions } from './data';
import { compareReliabilityOpportunities } from './model';

export function ReliabilityInboxBanner() {
  const styles = useStyles2(getStyles);
  const { data: opportunities = [] } = useCachedReliabilityInboxSuggestions();
  const exposureTracked = useRef(false);
  const topOpportunity = useMemo(
    () => [...opportunities].sort(compareReliabilityOpportunities)[0] as ReliabilityOpportunity | undefined,
    [opportunities]
  );

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
    <section className={styles.banner} aria-label="Reliability Inbox">
      <div className={styles.message}>
        <Icon name="ai-sparkle" className={styles.icon} aria-hidden="true" />
        <div>
          <strong>
            {topOpportunity
              ? `Reliability Inbox · ${opportunities.length} ${opportunities.length === 1 ? 'opportunity' : 'opportunities'}`
              : 'Reliability Inbox'}
          </strong>
          <span className={styles.priority}>
            {topOpportunity
              ? `Highest priority: ${topOpportunity.subject}`
              : 'Generate prioritized suggestions when you are ready to review them.'}
          </span>
        </div>
      </div>
      <LinkButton
        className={styles.assistantAction}
        icon="ai-sparkle"
        size={ASSISTANT_ACTION_SIZE}
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
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  banner: css({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1.25, 2),
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    flexWrap: 'wrap',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: '0 auto 0 0',
      width: 3,
      background: ASSISTANT_GRADIENT,
      borderRadius: `${theme.shape.radius.default} 0 0 ${theme.shape.radius.default}`,
      pointerEvents: 'none',
    },
  }),
  message: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.colors.text.primary,
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: theme.spacing(0.25),
      flexWrap: 'wrap',
    },
  }),
  priority: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  icon: css({
    color: theme.colors.text.primary,
    flexShrink: 0,
  }),
  assistantAction: getAssistantActionStyle(theme),
});
