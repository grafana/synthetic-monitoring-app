import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, Stack, Tab, TabsBar, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import pluralize from 'pluralize';

import { ReliabilityOpportunity } from '../model';
import { RELIABILITY_INBOX_CONTAINER } from '../ReliabilityInboxPage.constants';

interface RecommendationQueueProps {
  opportunities: ReliabilityOpportunity[];
  activeCount: number;
  dismissedCount: number;
  view: 'active' | 'dismissed';
  selectedId?: string;
  onSelect: (id: string) => void;
  onViewChange: (view: 'active' | 'dismissed') => void;
}

export function RecommendationQueue({
  opportunities,
  activeCount,
  dismissedCount,
  view,
  selectedId,
  onSelect,
  onViewChange,
}: RecommendationQueueProps) {
  const styles = useStyles2(getStyles);
  const totalCount = activeCount + dismissedCount;
  const [expanded, setExpanded] = useState(false);
  const contentId = 'reliability-inbox-recommendation-queue-content';

  return (
    <aside className={styles.queue} aria-label="Recommendations">
      <button
        type="button"
        className={cx(styles.disclosure, { [styles.expandedDisclosure]: expanded })}
        aria-label={`Recommendations, ${activeCount} active, ${dismissedCount} dismissed`}
        aria-controls={contentId}
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <strong>
          {totalCount} {pluralize('Recommendation', totalCount)}
        </strong>
        <Stack alignItems="center" gap={1}>
          <Badge color="blue" text={`${activeCount} active`} />
          <Icon name={expanded ? 'angle-up' : 'angle-down'} />
        </Stack>
      </button>
      <div id={contentId} className={cx(styles.content, { [styles.expandedContent]: expanded })}>
        <div className={styles.queueHeader}>
          <div className={styles.queueSummary}>
            <Stack direction="column" gap={0.5}>
              <strong>
                {totalCount} {pluralize('Recommendation', totalCount)}
              </strong>
              <Text variant="bodySmall" color="secondary">
                Ordered by technical signals
              </Text>
            </Stack>
          </div>
          <TabsBar className={styles.tabs} hideBorder>
            <Tab
              className={styles.tab}
              label="Active"
              counter={activeCount}
              active={view === 'active'}
              onChangeTab={() => onViewChange('active')}
            />
            <Tab
              className={styles.tab}
              label="Dismissed"
              counter={dismissedCount}
              active={view === 'dismissed'}
              onChangeTab={() => onViewChange('dismissed')}
            />
          </TabsBar>
        </div>
        {opportunities.length > 0 ? (
          <ol className={styles.queueList}>
            {opportunities.map((opportunity) => (
              <li className={styles.queueListItem} key={opportunity.id}>
                <button
                  className={cx(styles.queueItem, {
                    [styles.selectedQueueItem]: opportunity.id === selectedId,
                  })}
                  type="button"
                  aria-pressed={opportunity.id === selectedId}
                  onClick={() => {
                    setExpanded(false);
                    onSelect(opportunity.id);
                  }}
                >
                  <Stack direction="column" alignItems="flex-start" gap={0.5} minWidth={0}>
                    <span className={styles.queueSubject} title={opportunity.proposedCheck.target}>
                      {opportunity.subject}
                    </span>
                    <Text variant="bodySmall" color="secondary">
                      {view === 'dismissed'
                        ? 'Dismissed in this browser'
                        : `Missing check${opportunity.requestRate ? ` · ${opportunity.requestRate}` : ''}`}
                    </Text>
                  </Stack>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyQueue}>{view === 'dismissed' ? 'Nothing dismissed yet.' : 'Nothing active yet.'}</p>
        )}
      </div>
    </aside>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  queue: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    overflow: 'hidden',
  }),
  disclosure: css({
    alignItems: 'center',
    background: theme.colors.background.primary,
    border: 0,
    color: theme.colors.text.primary,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(1.25, 1.5),
    textAlign: 'left',
    width: '100%',
    [`@container ${RELIABILITY_INBOX_CONTAINER} (min-width: ${theme.breakpoints.values.md + 1}px)`]: {
      display: 'none',
    },
  }),
  expandedDisclosure: css({
    [`@container ${RELIABILITY_INBOX_CONTAINER} (max-width: ${theme.breakpoints.values.md}px)`]: {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    },
  }),
  content: css({
    display: 'block',
    [`@container ${RELIABILITY_INBOX_CONTAINER} (max-width: ${theme.breakpoints.values.md}px)`]: {
      display: 'none',
    },
  }),
  expandedContent: css({
    [`@container ${RELIABILITY_INBOX_CONTAINER} (max-width: ${theme.breakpoints.values.md}px)`]: {
      display: 'block',
    },
  }),
  queueHeader: css({
    background: theme.colors.background.primary,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(1.5),
  }),
  queueSummary: css({
    [`@container ${RELIABILITY_INBOX_CONTAINER} (max-width: ${theme.breakpoints.values.md}px)`]: {
      display: 'none',
    },
  }),
  tabs: css({
    margin: theme.spacing(1, -0.5, -1.5),
  }),
  tab: css({
    flex: 1,
    button: {
      textAlign: 'center',
      width: '100%',
    },
  }),
  queueList: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }),
  emptyQueue: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontStyle: 'italic',
    margin: 0,
    padding: theme.spacing(2),
    textAlign: 'center',
  }),
  queueListItem: css({
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    '&:last-child': { borderBottom: 0 },
  }),
  queueItem: css({
    display: 'block',
    width: '100%',
    padding: theme.spacing(1.5, 2),
    color: theme.colors.text.secondary,
    background: 'transparent',
    border: 0,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': { background: theme.colors.action.hover },
  }),
  queueSubject: css({
    fontWeight: theme.typography.fontWeightBold,
    overflowWrap: 'anywhere',
    width: '100%',
  }),
  selectedQueueItem: css({
    background: theme.colors.info.transparent,
    color: theme.colors.text.primary,
    boxShadow: `inset 3px 0 0 ${theme.colors.info.text}`,
  }),
});
