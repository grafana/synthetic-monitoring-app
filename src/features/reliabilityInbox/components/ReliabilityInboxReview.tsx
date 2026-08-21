import React, { useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { isFetchError } from '@grafana/runtime';
import { Button, EmptyState, Stack, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

import { ErrorAlert } from 'components/ErrorAlert';

import { useReliabilityInboxSuggestions } from '../data';
import { RELIABILITY_INBOX_CONTAINER } from '../ReliabilityInboxPage.constants';
import { useReliabilityInboxReview } from '../ReliabilityInboxPage.hooks';
import { RecommendationQueue } from './RecommendationQueue';
import { RefreshStatus } from './RefreshStatus';
import { ReliabilityInboxLoadingState } from './ReliabilityInboxLoadingState';
import { SuggestedCheckPanel } from './SuggestedCheckPanel';

interface ReliabilityInboxReviewProps {
  suggestionsQuery: ReturnType<typeof useReliabilityInboxSuggestions>;
}

export function ReliabilityInboxReview({ suggestionsQuery }: ReliabilityInboxReviewProps) {
  const styles = useStyles2(getStyles);
  const [exitTransition, setExitTransition] = useState<'fade' | 'dismiss'>();
  const pendingAction = useRef<(() => void) | undefined>();
  const {
    opportunities,
    activeOpportunities,
    dismissedOpportunities,
    queueView,
    selected,
    isLoading,
    isFetching,
    isError,
    error,
    data,
    assistantAction,
    refetch,
    selectOpportunity,
    setQueueView,
    dismissSelected,
    restoreSelected,
    createManually,
    setUpWithAssistant,
  } = useReliabilityInboxReview(suggestionsQuery);

  if (isLoading) {
    return <ReliabilityInboxLoadingState />;
  }

  if (isError && !data) {
    const isPermissionError = isFetchError(error) && (error.status === 401 || error.status === 403);
    return (
      <ErrorAlert
        buttonText="Retry"
        content={
          isPermissionError
            ? 'You do not have permission to load Reliability Inbox suggestions.'
            : 'The Reliability Inbox service is unavailable. Try again later.'
        }
        onClick={() => refetch()}
        title="Unable to load Reliability Inbox"
      />
    );
  }

  const refreshStatus = <RefreshStatus isFetching={isFetching} isError={isError} onRetry={() => refetch()} />;
  const runAfterExit = (transition: 'fade' | 'dismiss', action: () => void) => {
    if (exitTransition) {
      return;
    }

    if (!shouldAnimateTransitions()) {
      action();
      return;
    }

    pendingAction.current = action;
    setExitTransition(transition);
  };
  const finishExit = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (!exitTransition || event.target !== event.currentTarget) {
      return;
    }

    const action = pendingAction.current;
    pendingAction.current = undefined;
    setExitTransition(undefined);
    action?.();
  };
  const selectQueueOpportunity = (id: string) => {
    if (id === selected?.id) {
      return;
    }

    runAfterExit('fade', () => {
      selectOpportunity(id);
    });
  };
  const changeQueueView = (view: 'active' | 'dismissed') => {
    if (view !== queueView) {
      runAfterExit('fade', () => setQueueView(view));
    }
  };

  if (activeOpportunities.length === 0 && dismissedOpportunities.length === 0) {
    return (
      <Stack direction="column" gap={1}>
        {refreshStatus}
        <EmptyState message="No reviewable opportunities" variant="completed">
          Only public HTTP endpoints with enough evidence of missing coverage are shown.
        </EmptyState>
      </Stack>
    );
  }

  return (
    <div className={styles.reviewLayout}>
      {(isFetching || isError) && <div className={styles.refreshStatus}>{refreshStatus}</div>}
      <RecommendationQueue
        opportunities={opportunities}
        activeCount={activeOpportunities.length}
        dismissedCount={dismissedOpportunities.length}
        view={queueView}
        selectedId={selected?.id}
        onSelect={selectQueueOpportunity}
        onViewChange={changeQueueView}
      />
      <article className={styles.review}>
        <div
          key={`${queueView}:${selected?.id ?? 'empty'}`}
          className={cx(styles.selectionTransition, {
            [styles.fadingSelection]: exitTransition === 'fade',
            [styles.dismissingSelection]: exitTransition === 'dismiss',
          })}
          onAnimationEnd={finishExit}
        >
          {selected ? (
            <SuggestedCheckPanel
              opportunity={selected}
              assistantDisabled={assistantAction.disabled}
              assistantTooltip={assistantAction.tooltip}
              dismissed={queueView === 'dismissed'}
              onCreateManually={createManually}
              onDismiss={() => runAfterExit('dismiss', dismissSelected)}
              onRestore={() => runAfterExit('fade', restoreSelected)}
              onSetUpWithAssistant={setUpWithAssistant}
            />
          ) : (
            <EmptyState
              message={queueView === 'active' ? 'No active recommendations' : 'No dismissed suggestions'}
              variant="completed"
            >
              <Stack direction="column" gap={2} alignItems="center">
                <span>
                  {queueView === 'active'
                    ? 'Dismissed suggestions remain available from the recommendations panel.'
                    : 'Suggestions dismissed in this browser will appear here.'}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => changeQueueView(queueView === 'active' ? 'dismissed' : 'active')}
                >
                  View {queueView === 'active' ? 'dismissed' : 'active'} suggestions
                </Button>
              </Stack>
            </EmptyState>
          )}
        </div>
      </article>
    </div>
  );
}

function shouldAnimateTransitions() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  );
}

const selectionFadeIn = keyframes({
  from: {
    opacity: 0.45,
  },
  to: {
    opacity: 1,
  },
});

const selectionFadeOut = keyframes({
  from: {
    opacity: 1,
  },
  to: {
    opacity: 0.45,
  },
});

const dismissalExit = keyframes({
  from: {
    opacity: 1,
    transform: 'translateX(0) rotate(0)',
  },
  to: {
    opacity: 0.3,
    transform: 'translateX(-16px) rotate(-0.4deg)',
  },
});

const getStyles = (theme: GrafanaTheme2) => ({
  refreshStatus: css({ gridColumn: '1 / -1' }),
  reviewLayout: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, min(30%, 360px)) minmax(0, 1fr)',
    gap: theme.spacing(2),
    alignItems: 'stretch',
    minHeight: `calc(100vh - ${theme.spacing(22)})`,
    [`@container ${RELIABILITY_INBOX_CONTAINER} (max-width: ${theme.breakpoints.values.md}px)`]: {
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
  selectionTransition: css({
    minWidth: 0,
    [theme.transitions.handleMotion('no-preference')]: {
      animationDuration: '120ms',
      animationFillMode: 'both',
      animationName: selectionFadeIn,
      animationTimingFunction: 'ease-out',
    },
  }),
  fadingSelection: css({
    pointerEvents: 'none',
    [theme.transitions.handleMotion('no-preference')]: {
      animationDuration: '100ms',
      animationFillMode: 'both',
      animationName: selectionFadeOut,
      animationTimingFunction: 'ease-in',
    },
  }),
  dismissingSelection: css({
    pointerEvents: 'none',
    [theme.transitions.handleMotion('no-preference')]: {
      animationDuration: '160ms',
      animationFillMode: 'both',
      animationName: dismissalExit,
      animationTimingFunction: 'ease-in',
    },
  }),
});
