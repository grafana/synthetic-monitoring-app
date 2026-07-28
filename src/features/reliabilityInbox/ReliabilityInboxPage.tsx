import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, Button, Icon, Spinner, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackRecommendationReviewed } from 'features/tracking/reliabilityInboxEvents';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { useReliabilityInboxSuggestions } from './data';
import { ReliabilityInboxQueue } from './ReliabilityInboxQueue';
import { ReliabilityOpportunityDetail } from './ReliabilityOpportunityDetail';
import { useReliabilityInboxAssistant } from './useReliabilityInboxAssistant';

export const RELIABILITY_INBOX_PAGE_NAV: NavModelItem = {
  text: 'Reliability Inbox',
  parentItem: {
    text: 'Synthetics',
    url: generateRoutePath(AppRoutes.Home),
  },
};

export function ReliabilityInboxPage() {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage pageNav={RELIABILITY_INBOX_PAGE_NAV} renderTitle={() => <ReliabilityInboxTitle />}>
      <div className={styles.page}>
        <p className={styles.subtitle}>Review suggested synthetic checks for important public endpoints.</p>
        <ReliabilityInboxReview />
      </div>
    </PluginPage>
  );
}

function ReliabilityInboxReview() {
  const styles = useStyles2(getStyles);
  const { data: opportunities = [], isLoading, isError, refetch } = useReliabilityInboxSuggestions();
  const {
    startReview,
    disabled: assistantDisabled,
    disabledReason: assistantDisabledReason,
  } = useReliabilityInboxAssistant();
  const [selectedId, setSelectedId] = useState<string>();
  const reviewedIds = useRef(new Set<string>());
  const sortedOpportunities = useMemo(
    () => [...opportunities].sort((a, b) => b.sortScore - a.sortScore),
    [opportunities]
  );
  const selected = sortedOpportunities.find((opportunity) => opportunity.id === selectedId) ?? sortedOpportunities[0];

  useEffect(() => {
    if (!selected || reviewedIds.current.has(selected.id)) {
      return;
    }

    reviewedIds.current.add(selected.id);
    trackRecommendationReviewed({
      opportunityId: selected.id,
      checkType: selected.proposedCheck.checkType,
    });
  }, [selected]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
        <span>Loading Reliability Inbox…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" title="Unable to load Reliability Inbox">
        <div className={styles.retryAlert}>
          <span>Try again. If the problem continues, contact your Grafana administrator.</span>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (!selected) {
    return (
      <div className={styles.emptyState}>
        <Icon name="check-circle" size="xl" />
        <h2>No suggested checks to review</h2>
        <p>Private, development-only, non-HTTP, covered, and incomplete targets are excluded from this experiment.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewLayout}>
      <ReliabilityInboxQueue onSelect={setSelectedId} opportunities={sortedOpportunities} selectedId={selected.id} />
      <ReliabilityOpportunityDetail
        assistantDisabled={assistantDisabled}
        assistantDisabledReason={assistantDisabledReason}
        key={selected.id}
        onReview={() => startReview(selected)}
        opportunity={selected}
      />
    </div>
  );
}

function ReliabilityInboxTitle() {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.titleRow}>
      <h1>Reliability Inbox</h1>
      <Badge color="blue" text="Experimental" />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: 0,
  }),
  titleRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1.5),
    '& h1': {
      margin: 0,
    },
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    margin: 0,
  }),
  reviewLayout: css({
    alignItems: 'start',
    display: 'grid',
    gap: theme.spacing(3),
    gridTemplateColumns: 'minmax(280px, 320px) minmax(0, 1fr)',
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gap: theme.spacing(2),
      gridTemplateColumns: '1fr',
    },
  }),
  loading: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'center',
    minHeight: 240,
  }),
  emptyState: css({
    alignItems: 'center',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    justifyContent: 'center',
    minHeight: 240,
    padding: theme.spacing(4),
    textAlign: 'center',
    '& h2, & p': {
      margin: 0,
    },
  }),
  retryAlert: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
  }),
});
