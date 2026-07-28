import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackRecommendationDetailToggled } from 'features/tracking/reliabilityInboxEvents';

import { ReliabilityOpportunity } from './types';

import { OpportunitySignalBadges } from './OpportunitySignalBadges';
import { ReliabilityEvidenceSnapshot } from './ReliabilityEvidenceSnapshot';
import { ReliabilityOpportunityDetails, ReliabilityOpportunityDetailType } from './ReliabilityOpportunityDetails';
import { SuggestedCheckCard } from './SuggestedCheckCard';

interface ReliabilityOpportunityDetailProps {
  opportunity: ReliabilityOpportunity;
  assistantDisabled: boolean;
  assistantDisabledReason?: string;
  onReview: () => void;
}

export function ReliabilityOpportunityDetail({
  opportunity,
  assistantDisabled,
  assistantDisabledReason,
  onReview,
}: ReliabilityOpportunityDetailProps) {
  const styles = useStyles2(getStyles);

  const trackDetailToggle = (detailType: ReliabilityOpportunityDetailType, open: boolean) => {
    trackRecommendationDetailToggled({
      opportunityId: opportunity.id,
      checkType: opportunity.proposedCheck.checkType,
      detailType,
      open,
    });
  };

  return (
    <article className={styles.review}>
      <header className={styles.summary}>
        <div className={styles.readingColumn}>
          <span className={styles.eyebrow}>Potential monitoring gap</span>
          <h2>{opportunity.gapTitle}</h2>
          <OpportunitySignalBadges
            ariaLabel="Recommendation signals"
            confidence={opportunity.confidence}
            value={opportunity.value}
          />
          <p className={styles.coverageSummary}>{opportunity.coverageSummary}</p>
          <div className={styles.importance}>
            <h3>Why this matters</h3>
            <p>{opportunity.importanceSummary}</p>
          </div>
          <ReliabilityEvidenceSnapshot evidence={opportunity.evidenceSnapshot} />
        </div>
      </header>
      <SuggestedCheckCard
        disabled={assistantDisabled}
        disabledReason={assistantDisabledReason}
        onReview={onReview}
        opportunity={opportunity}
      />
      <ReliabilityOpportunityDetails key={opportunity.id} onToggle={trackDetailToggle} opportunity={opportunity} />
    </article>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  review: css({
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    minWidth: 0,
    overflow: 'hidden',
  }),
  summary: css({
    padding: theme.spacing(2.5),
  }),
  readingColumn: css({
    maxWidth: 800,
    minWidth: 0,
    '& h2': {
      color: theme.colors.text.primary,
      fontSize: theme.typography.h3.fontSize,
      lineHeight: 1.25,
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
  coverageSummary: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 1.5,
    margin: theme.spacing(2, 0, 0),
    maxWidth: '72ch',
  }),
  importance: css({
    marginTop: theme.spacing(2),
    maxWidth: '72ch',
    '& h3': {
      color: theme.colors.text.primary,
      fontSize: theme.typography.body.fontSize,
      margin: theme.spacing(0, 0, 0.5),
    },
    '& p': {
      color: theme.colors.text.secondary,
      lineHeight: 1.5,
      margin: 0,
    },
  }),
});
