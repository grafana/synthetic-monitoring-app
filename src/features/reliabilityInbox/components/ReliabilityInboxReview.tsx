import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { EmptyState, LoadingPlaceholder, Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ErrorAlert } from 'components/ErrorAlert';

import { useReliabilityInboxReview } from '../ReliabilityInboxPage.hooks';
import { DismissalToast } from './DismissalToast';
import { RecommendationEvidence } from './RecommendationEvidence';
import { RecommendationQueue } from './RecommendationQueue';
import { RefreshStatus } from './RefreshStatus';
import { SuggestedCheckPanel } from './SuggestedCheckPanel';

export function ReliabilityInboxReview() {
  const styles = useStyles2(getStyles);
  const {
    opportunities,
    selected,
    isLoading,
    isFetching,
    isError,
    data,
    lastDismissedId,
    assistantAction,
    refetch,
    selectOpportunity,
    dismissSelected,
    undoDismiss,
    clearDismissalToast,
    setUpWithAssistant,
  } = useReliabilityInboxReview();

  if (isLoading) {
    return <LoadingPlaceholder text="Loading Reliability Inbox…" />;
  }

  if (isError && !data) {
    return (
      <ErrorAlert
        buttonText="Retry"
        content="Check your permissions and the live Reliability Inbox service, then try again."
        onClick={() => refetch()}
        title="Unable to load Reliability Inbox"
      />
    );
  }

  const refreshStatus = <RefreshStatus isFetching={isFetching} isError={isError} onRetry={() => refetch()} />;
  const dismissalToast = lastDismissedId ? (
    <DismissalToast onUndo={undoDismiss} onRemove={clearDismissalToast} />
  ) : null;

  if (!selected) {
    return (
      <Stack direction="column" gap={1}>
        {refreshStatus}
        <EmptyState message="No reviewable opportunities" variant="completed">
          Only public HTTP endpoints with enough evidence of missing coverage are shown.
        </EmptyState>
        {dismissalToast}
      </Stack>
    );
  }

  return (
    <div className={styles.reviewLayout}>
      {(isFetching || isError) && <div className={styles.refreshStatus}>{refreshStatus}</div>}
      <RecommendationQueue opportunities={opportunities} selectedId={selected.id} onSelect={selectOpportunity} />
      <article className={styles.review}>
        <SuggestedCheckPanel
          opportunity={selected}
          assistantDisabled={assistantAction.disabled}
          assistantTooltip={assistantAction.tooltip}
          onDismiss={dismissSelected}
          onSetUpWithAssistant={setUpWithAssistant}
        />
        <RecommendationEvidence opportunity={selected} />
      </article>
      {dismissalToast}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  refreshStatus: css({ gridColumn: '1 / -1' }),
  reviewLayout: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 360px) minmax(0, 1fr)',
    gap: theme.spacing(2),
    alignItems: 'stretch',
    minHeight: `calc(100vh - ${theme.spacing(22)})`,
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
      minHeight: 'auto',
    },
  }),
  review: css({
    display: 'grid',
    gap: theme.spacing(2),
    minWidth: 0,
    alignSelf: 'start',
  }),
});
