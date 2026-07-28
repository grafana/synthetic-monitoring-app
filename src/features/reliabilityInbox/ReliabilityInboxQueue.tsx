import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { ReliabilityOpportunity } from './types';

import { OpportunitySignalBadges } from './OpportunitySignalBadges';

interface ReliabilityInboxQueueProps {
  opportunities: ReliabilityOpportunity[];
  selectedId: string;
  onSelect: (opportunityId: string) => void;
}

export function ReliabilityInboxQueue({ opportunities, selectedId, onSelect }: ReliabilityInboxQueueProps) {
  const styles = useStyles2(getStyles);

  return (
    <aside className={styles.queue} aria-label="Suggested checks">
      <div className={styles.queueHeader}>
        <strong>Suggested checks</strong>
        <span className={styles.count} aria-label={`${opportunities.length} suggestions`}>
          {opportunities.length}
        </span>
      </div>
      <ol className={styles.queueList}>
        {opportunities.map((opportunity, index) => {
          const isSelected = opportunity.id === selectedId;

          return (
            <li key={opportunity.id}>
              <button
                className={cx(styles.queueItem, { [styles.selectedQueueItem]: isSelected })}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(opportunity.id)}
              >
                <span className={styles.rank}>{index === 0 ? 'Highest priority' : `#${index + 1}`}</span>
                <strong className={styles.subject} title={opportunity.proposedCheck.target}>
                  {opportunity.subject}
                </strong>
                <OpportunitySignalBadges
                  ariaLabel={`Decision signals for ${opportunity.subject}`}
                  compact
                  confidence={opportunity.confidence}
                  value={opportunity.value}
                />
                <span className={styles.metadata}>
                  Public HTTP · {opportunity.requestRate ?? 'request rate unavailable'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  queue: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    minWidth: 0,
    overflow: 'hidden',
  }),
  queueHeader: css({
    alignItems: 'center',
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: theme.spacing(5),
    padding: theme.spacing(1, 1.5),
  }),
  count: css({
    alignItems: 'center',
    background: theme.colors.info.transparent,
    border: `1px solid ${theme.colors.info.border}`,
    borderRadius: theme.shape.radius.default,
    color: theme.colors.info.text,
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    justifyContent: 'center',
    minWidth: theme.spacing(3),
    padding: theme.spacing(0.125, 0.5),
  }),
  queueList: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    '& > li:last-child button': {
      borderBottom: 0,
    },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      maxHeight: 320,
      overflowY: 'auto',
    },
  }),
  queueItem: css({
    alignItems: 'flex-start',
    background: 'transparent',
    border: 0,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    color: theme.colors.text.secondary,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    minHeight: 88,
    padding: theme.spacing(1.25, 1.5),
    textAlign: 'left',
    width: '100%',
    '&:hover': {
      background: theme.colors.action.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.border}`,
      outlineOffset: -2,
      position: 'relative',
      zIndex: 1,
    },
  }),
  selectedQueueItem: css({
    background: theme.colors.info.transparent,
    boxShadow: `inset 3px 0 0 ${theme.colors.info.border}`,
  }),
  rank: css({
    color: theme.colors.info.text,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
  }),
  subject: css({
    color: theme.colors.text.primary,
    display: '-webkit-box',
    lineHeight: 1.35,
    maxWidth: '100%',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
  }),
  metadata: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: 1.35,
  }),
});
