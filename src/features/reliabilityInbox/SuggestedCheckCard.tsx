import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ReliabilityOpportunity } from './types';

import { ASSISTANT_ACTION_SIZE, getAssistantActionStyle } from './assistantActionStyles';

interface SuggestedCheckCardProps {
  opportunity: ReliabilityOpportunity;
  disabled: boolean;
  disabledReason?: string;
  onReview: () => void;
}

export function SuggestedCheckCard({ opportunity, disabled, disabledReason, onReview }: SuggestedCheckCardProps) {
  const styles = useStyles2(getStyles);

  return (
    <section className={styles.card} aria-labelledby="reliability-inbox-suggested-check-title">
      <div className={styles.checkSummary}>
        <span className={styles.eyebrow}>Suggested check</span>
        <h3 id="reliability-inbox-suggested-check-title">
          {opportunity.proposedCheck.method} {opportunity.subject}
        </h3>
        <div className={styles.configurationSummary}>
          <Icon name="globe" />
          <div>
            <strong>{opportunity.actionSummary}</strong>
            <span>{opportunity.proposedCheck.locationPolicy}</span>
          </div>
        </div>
      </div>
      <div className={styles.action}>
        <Button
          aria-describedby="reliability-inbox-assistant-action-help"
          className={styles.assistantAction}
          icon="ai-sparkle"
          disabled={disabled}
          tooltip={disabledReason}
          size={ASSISTANT_ACTION_SIZE}
          variant="secondary"
          onClick={onReview}
        >
          Review and customize check
        </Button>
        <span id="reliability-inbox-assistant-action-help">
          You’ll review the final configuration before anything is created.
        </span>
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  card: css({
    alignItems: 'center',
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    display: 'grid',
    gap: theme.spacing(3),
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    margin: theme.spacing(0, 2.5, 2.5),
    padding: theme.spacing(2),
    [`@media (max-width: ${theme.breakpoints.values.lg}px)`]: {
      alignItems: 'start',
      gridTemplateColumns: '1fr',
    },
  }),
  checkSummary: css({
    minWidth: 0,
    '& h3': {
      color: theme.colors.text.primary,
      margin: theme.spacing(0.5, 0, 1.25),
      overflowWrap: 'anywhere',
    },
  }),
  eyebrow: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'uppercase',
  }),
  configurationSummary: css({
    alignItems: 'flex-start',
    display: 'flex',
    gap: theme.spacing(1),
    '& > svg': {
      color: theme.colors.info.text,
      flexShrink: 0,
      marginTop: theme.spacing(0.25),
    },
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      minWidth: 0,
    },
    '& span': {
      color: theme.colors.text.secondary,
      lineHeight: 1.4,
    },
  }),
  action: css({
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    maxWidth: 320,
    '& > span': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      lineHeight: 1.4,
      textAlign: 'left',
    },
    [`@media (max-width: ${theme.breakpoints.values.sm}px)`]: {
      maxWidth: 'none',
      width: '100%',
      '& > button': {
        justifyContent: 'center',
        width: '100%',
      },
    },
  }),
  assistantAction: getAssistantActionStyle(theme),
});
