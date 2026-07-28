import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, ClipboardButton, Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ReliabilityOpportunity } from './types';

import { formatDuration } from './model';
import { ReliabilityEvidenceInvestigation } from './ReliabilityEvidenceInvestigation';
import { ReliabilityEvidenceTrend } from './ReliabilityEvidenceTrend';

export type ReliabilityOpportunityDetailType = 'evidence' | 'coverage' | 'configuration';

interface ReliabilityOpportunityDetailsProps {
  opportunity: ReliabilityOpportunity;
  onToggle?: (detailType: ReliabilityOpportunityDetailType, open: boolean) => void;
}

export function ReliabilityOpportunityDetails({ opportunity, onToggle }: ReliabilityOpportunityDetailsProps) {
  const styles = useStyles2(getStyles);
  const [openDetails, setOpenDetails] = useState<Set<ReliabilityOpportunityDetailType>>(new Set());

  const handleToggle =
    (detailType: ReliabilityOpportunityDetailType) => (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      const open = event.currentTarget.open;
      setOpenDetails((current) => {
        const next = new Set(current);
        if (open) {
          next.add(detailType);
        } else {
          next.delete(detailType);
        }
        return next;
      });
      onToggle?.(detailType, open);
    };

  return (
    <section className={styles.details} aria-label="Opportunity details">
      <details className={styles.disclosure} onToggle={handleToggle('evidence')}>
        <summary>
          <Icon name="angle-right" />
          <span>Evidence and reasoning</span>
        </summary>
        {openDetails.has('evidence') && (
          <div className={styles.disclosureContent}>
            <div className={styles.disclosureHeading}>
              <h3>Observed evidence</h3>
              {opportunity.evidenceSnapshot.sourceKind === 'prototype' && <Badge color="purple" text="Demo evidence" />}
            </div>
            <EvidenceMetrics opportunity={opportunity} />
            <ReliabilityEvidenceInvestigation opportunity={opportunity} showUnavailable />
            {opportunity.evidencePrototype && <ReliabilityEvidenceTrend evidence={opportunity.evidencePrototype} />}
            <p>{opportunity.importanceSummary}</p>
            <p>
              Evidence covers {opportunity.evidenceSnapshot.windowLabel} and came from{' '}
              {formatList(opportunity.suggestion.evidence.families)}.
            </p>
            {opportunity.evidencePrototype ? (
              <p>
                The trend and exact total are demo contract data. Live suggestions continue to use aggregate evidence
                until the backend supplies an equivalent window and series.
              </p>
            ) : (
              <p>Available aggregate telemetry is shown for the last hour; unavailable measurements are omitted.</p>
            )}
          </div>
        )}
      </details>

      <details className={styles.disclosure} onToggle={handleToggle('coverage')}>
        <summary>
          <Icon name="angle-right" />
          <span>Coverage detection details</span>
        </summary>
        {openDetails.has('coverage') && (
          <div className={styles.disclosureContent}>
            <h3>How coverage was checked</h3>
            <p>We compared this endpoint and path with the HTTP checks available to us.</p>
            <p>
              Similar or indirect monitoring may still exist through aliases, redirects, upstream checks, checks we
              cannot access, or other paths.
            </p>
            <ConfidenceDetails opportunity={opportunity} />
          </div>
        )}
      </details>

      <details className={styles.disclosure} onToggle={handleToggle('configuration')}>
        <summary>
          <Icon name="angle-right" />
          <span>Full check configuration</span>
        </summary>
        {openDetails.has('configuration') && (
          <div className={styles.disclosureContent}>
            <h3>Proposed HTTP check</h3>
            <dl className={styles.configuration}>
              <div className={styles.exactTarget}>
                <dt>Target URL</dt>
                <dd className={styles.targetValue}>
                  <code>{opportunity.proposedCheck.target}</code>
                  <ClipboardButton
                    aria-label="Copy target URL"
                    fill="text"
                    getText={() => opportunity.proposedCheck.target}
                    icon="clipboard-alt"
                    size="sm"
                    variant="secondary"
                  >
                    Copy
                  </ClipboardButton>
                </dd>
              </div>
              <div>
                <dt>Frequency</dt>
                <dd>Every {formatDuration(opportunity.proposedCheck.frequencyMs)}</dd>
              </div>
              <div>
                <dt>Timeout</dt>
                <dd>{formatDuration(opportunity.proposedCheck.timeoutMs)}</dd>
              </div>
              <div>
                <dt>Expected response</dt>
                <dd>HTTP {opportunity.proposedCheck.validStatusCodes.join(', ')}</dd>
              </div>
              <div>
                <dt>TLS requirement</dt>
                <dd>{opportunity.proposedCheck.failIfNotSSL ? 'Require HTTPS' : 'Not required'}</dd>
              </div>
              <div>
                <dt>Probe / location policy</dt>
                <dd>{opportunity.proposedCheck.locationPolicy}</dd>
              </div>
              {opportunity.estimatedUsage && (
                <div>
                  <dt>Estimated usage</dt>
                  <dd>{opportunity.estimatedUsage.replace(/^Estimated usage:\s*/, '')}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </details>
    </section>
  );
}

function EvidenceMetrics({ opportunity }: { opportunity: ReliabilityOpportunity }) {
  const styles = useStyles2(getStyles);
  const metrics = [opportunity.evidenceSnapshot.primary, ...opportunity.evidenceSnapshot.supporting].filter(
    (metric) => metric !== undefined
  );

  if (metrics.length === 0) {
    return (
      <div className={styles.evidenceUnavailable} role="status">
        <Icon name="info-circle" />
        <span>Detailed traffic measurements are unavailable for this suggestion.</span>
      </div>
    );
  }

  return (
    <dl className={styles.metrics}>
      {metrics.map((metric) => (
        <div key={`${metric.label}-${metric.value}`}>
          <dt>{metric.label}</dt>
          <dd>{metric.value}</dd>
        </div>
      ))}
      <div>
        <dt>Evidence window</dt>
        <dd>{opportunity.evidenceSnapshot.windowLabel}</dd>
      </div>
    </dl>
  );
}

function ConfidenceDetails({ opportunity }: { opportunity: ReliabilityOpportunity }) {
  const styles = useStyles2(getStyles);
  const breakdown = opportunity.suggestion.confidenceBreakdown;

  if (!breakdown) {
    return (
      <dl className={styles.confidence}>
        <div>
          <dt>Overall confidence</dt>
          <dd>{capitalize(opportunity.confidence)}</dd>
        </div>
      </dl>
    );
  }

  const dimensions = [
    ['Observation confidence', breakdown.observation],
    ['Coverage-gap confidence', breakdown.coverageGap],
    ['Recommendation confidence', breakdown.recommendation],
  ] as const;

  return (
    <dl className={styles.confidence}>
      {dimensions.map(
        ([label, dimension]) =>
          dimension && (
            <div key={label}>
              <dt>{label}</dt>
              <dd>
                {capitalize(dimension.level)}
                {dimension.reason ? ` · ${dimension.reason}` : ''}
              </dd>
            </div>
          )
      )}
    </dl>
  );
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ').replaceAll('_', ' ') : 'available request telemetry';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const getStyles = (theme: GrafanaTheme2) => ({
  details: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(0, 2.5, 1.5),
  }),
  disclosure: css({
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    '&:last-child': {
      borderBottom: 0,
    },
    '& summary': {
      alignItems: 'center',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      display: 'flex',
      fontWeight: theme.typography.fontWeightMedium,
      gap: theme.spacing(0.75),
      listStyle: 'none',
      minHeight: theme.spacing(5),
      padding: theme.spacing(0.75, 0),
      '&::-webkit-details-marker': {
        display: 'none',
      },
      '&:hover': {
        color: theme.colors.text.primary,
      },
      '&:focus-visible': {
        borderRadius: theme.shape.radius.default,
        outline: `2px solid ${theme.colors.primary.border}`,
        outlineOffset: -2,
      },
      '& svg': {
        flexShrink: 0,
        transition: 'transform 0.1s ease',
      },
    },
    '&[open] > summary svg': {
      transform: 'rotate(90deg)',
    },
  }),
  disclosureContent: css({
    color: theme.colors.text.secondary,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.25),
    maxWidth: 960,
    padding: theme.spacing(0.5, 0, 2, 2.5),
    '& h3, & p, & dl': {
      margin: 0,
    },
    '& h3': {
      color: theme.colors.text.primary,
      fontSize: theme.typography.h5.fontSize,
    },
  }),
  disclosureHeading: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
  }),
  metrics: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1, 3),
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      minWidth: 140,
    },
    '& dt': {
      fontSize: theme.typography.bodySmall.fontSize,
    },
    '& dd': {
      color: theme.colors.text.primary,
      fontSize: theme.typography.h5.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      margin: 0,
    },
  }),
  evidenceUnavailable: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    minHeight: theme.spacing(6),
    '& > svg': {
      color: theme.colors.info.text,
    },
  }),
  confidence: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    paddingTop: theme.spacing(0.5),
    '& > div': {
      display: 'grid',
      gap: theme.spacing(1),
      gridTemplateColumns: 'minmax(160px, 220px) minmax(0, 1fr)',
    },
    '& dt': {
      fontWeight: theme.typography.fontWeightMedium,
    },
    '& dd': {
      color: theme.colors.text.primary,
      margin: 0,
    },
    [`@media (max-width: ${theme.breakpoints.values.sm}px)`]: {
      '& > div': {
        gridTemplateColumns: '1fr',
        gap: theme.spacing(0.25),
      },
    },
  }),
  configuration: css({
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    width: '100%',
    '& > div': {
      borderTop: `1px solid ${theme.colors.border.weak}`,
      padding: theme.spacing(1, 0),
    },
    '& dt': {
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightBold,
    },
    '& dd': {
      color: theme.colors.text.primary,
      margin: theme.spacing(0.5, 0, 0),
      overflowWrap: 'anywhere',
    },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
    },
  }),
  exactTarget: css({
    gridColumn: '1 / -1',
  }),
  targetValue: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    justifyContent: 'space-between',
    minWidth: 0,
    '& code': {
      fontFamily: theme.typography.fontFamilyMonospace,
      minWidth: 0,
      overflowWrap: 'anywhere',
    },
  }),
});
