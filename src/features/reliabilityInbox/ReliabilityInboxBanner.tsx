import React, { useEffect, useMemo, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, LinkButton, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackInboxExposure, trackReviewEntryClicked } from 'features/tracking/reliabilityInboxEvents';

import { ReliabilityOpportunity } from './types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { useReliabilityInboxSuggestions } from './data';

export function ReliabilityInboxBanner() {
  const styles = useStyles2(getStyles);
  const { data: opportunities = [] } = useReliabilityInboxSuggestions();
  const exposureTracked = useRef(false);
  const topOpportunity = useMemo(
    () =>
      opportunities.reduce<ReliabilityOpportunity | undefined>(
        (top, opportunity) => (!top || opportunity.sortScore > top.sortScore ? opportunity : top),
        undefined
      ),
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

  if (!topOpportunity) {
    return null;
  }

  return (
    <section className={styles.banner} aria-label="Reliability Inbox">
      <div className={styles.message}>
        <Icon name="ai-sparkle" className={styles.icon} />
        <div>
          <strong>
            Reliability Inbox · {opportunities.length} {opportunities.length === 1 ? 'opportunity' : 'opportunities'}
          </strong>
          <span className={styles.priority}>Highest priority: {topOpportunity.subject}</span>
        </div>
      </div>
      <LinkButton
        icon="arrow-right"
        size="sm"
        variant="secondary"
        href={generateRoutePath(AppRoutes.ReliabilityInbox)}
        onClick={() =>
          trackReviewEntryClicked({
            opportunityId: topOpportunity.id,
            checkType: topOpportunity.proposedCheck.checkType,
          })
        }
      >
        Review opportunities
      </LinkButton>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  banner: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1.25, 2),
    border: `1px solid ${theme.colors.info.border}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.info.transparent,
    flexWrap: 'wrap',
  }),
  message: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.colors.text.primary,
    '& > div': {
      display: 'flex',
      alignItems: 'baseline',
      gap: theme.spacing(1),
      flexWrap: 'wrap',
    },
  }),
  priority: css({
    color: theme.colors.text.secondary,
  }),
  icon: css({
    color: theme.colors.info.text,
    flexShrink: 0,
  }),
});
