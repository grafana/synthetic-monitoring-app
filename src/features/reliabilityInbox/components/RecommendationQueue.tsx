import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { ReliabilityOpportunity } from '../model';

interface RecommendationQueueProps {
  opportunities: ReliabilityOpportunity[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function RecommendationQueue({ opportunities, selectedId, onSelect }: RecommendationQueueProps) {
  const styles = useStyles2(getStyles);

  return (
    <aside className={styles.queue} aria-label="Recommendations">
      <div className={styles.queueHeader}>
        <Stack direction="column" gap={0.5}>
          <Stack alignItems="center" justifyContent="space-between" gap={1}>
            <strong>Recommendations</strong>
            <Badge color="blue" text={`${opportunities.length}`} />
          </Stack>
          <Text variant="bodySmall" color="secondary">
            Ordered by technical signals
          </Text>
        </Stack>
      </div>
      <ol className={styles.queueList}>
        {opportunities.map((opportunity, index) => (
          <li className={styles.queueListItem} key={opportunity.id}>
            <button
              className={cx(styles.queueItem, {
                [styles.selectedQueueItem]: opportunity.id === selectedId,
              })}
              type="button"
              aria-pressed={opportunity.id === selectedId}
              onClick={() => onSelect(opportunity.id)}
            >
              <Badge aria-hidden="true" className={styles.queueRank} color="darkgrey" text={`${index + 1}`} />
              <Stack direction="column" alignItems="flex-start" gap={0.5} minWidth={0}>
                <span className={styles.queueSubject} title={opportunity.proposedCheck.target}>
                  {opportunity.subject}
                </span>
                <Text variant="bodySmall" color="secondary">
                  Missing check{opportunity.requestRate ? ` · ${opportunity.requestRate}` : ''}
                </Text>
              </Stack>
            </button>
          </li>
        ))}
      </ol>
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
  queueHeader: css({
    background: theme.colors.background.primary,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(1.5),
  }),
  queueList: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
  }),
  queueListItem: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    '&:last-child': { borderBottom: 0 },
  }),
  queueItem: css({
    alignItems: 'flex-start',
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: '24px minmax(0, 1fr)',
    width: '100%',
    padding: theme.spacing(1.25, 1.5),
    color: theme.colors.text.secondary,
    background: 'transparent',
    border: 0,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': { background: theme.colors.action.hover },
  }),
  queueRank: css({
    boxSizing: 'border-box',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: theme.typography.fontWeightBold,
    justifyContent: 'center',
    minWidth: theme.spacing(3),
  }),
  queueSubject: css({
    fontWeight: theme.typography.fontWeightBold,
    overflowWrap: 'anywhere',
    width: '100%',
  }),
  selectedQueueItem: css({
    background: theme.colors.info.transparent,
    color: theme.colors.text.primary,
    boxShadow: `inset 3px 0 0 ${theme.colors.info.border}`,
  }),
});
