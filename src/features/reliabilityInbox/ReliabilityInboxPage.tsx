import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, Button, Icon, Spinner, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackRecommendationReviewed, trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';

import { getUserPermissions } from 'data/permissions';

import { useReliabilityInboxSuggestions } from './data';
import { formatDuration } from './model';

const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/reliability-inbox';

export function ReliabilityInboxPage() {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage pageNav={{ text: 'Reliability Inbox' }} renderTitle={() => <ReliabilityInboxTitle />}>
      <div className={styles.page}>
        <p className={styles.subtitle}>
          Prioritized monitoring opportunities from observed traffic. Review first; nothing is created without your
          confirmation.
        </p>
        <ReliabilityInboxReview />
      </div>
    </PluginPage>
  );
}

function ReliabilityInboxReview() {
  const styles = useStyles2(getStyles);
  const { canWriteChecks } = getUserPermissions();
  const { isAvailable: isAssistantAvailable, isLoading: isAssistantLoading, openAssistant } = useAssistant();
  const { data: opportunities = [], isLoading, isError, refetch } = useReliabilityInboxSuggestions();
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
          <span>Check that the Reliability Inbox fixture interceptor is enabled in Graft.</span>
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
        <h2>No reviewable opportunities</h2>
        <p>Private, development-only, non-HTTP, and incomplete targets are excluded from this experiment.</p>
      </div>
    );
  }

  const assistantDisabled = !canWriteChecks || isAssistantLoading || !isAssistantAvailable || !openAssistant;
  const assistantTooltip = !canWriteChecks
    ? 'You need permission to create checks'
    : !isAssistantLoading && (!isAssistantAvailable || !openAssistant)
      ? 'Grafana Assistant is unavailable'
      : undefined;

  const setUpWithAssistant = () => {
    if (!openAssistant) {
      return;
    }

    trackSetupWithAssistant({
      opportunityId: selected.id,
      checkType: selected.proposedCheck.checkType,
    });

    const suggestedDraft = selected.proposedCheck;
    const evidence = {
      target: selected.suggestion.target,
      recommendationRationale: selected.rationale,
      confidence: selected.confidence,
      requestsPerSecond: selected.suggestion.evidence.reqPerS,
      estimatedRequestsInWindow: selected.requestVolume,
      p99Milliseconds: selected.suggestion.evidence.p99Ms,
      httpErrorRate: selected.errorRate,
      statusDistribution: selected.suggestion.evidence.statusDistribution,
      measurementWindow: 'last hour',
      telemetryFamilies: selected.suggestion.evidence.families,
      reachability: {
        classification: selected.suggestion.reachability,
        source: selected.suggestion.reachabilitySource,
      },
      coverageMatch: {
        conclusion: 'No exact matching check was found among the configuration the experiment could analyze.',
        compared: ['observed target', 'URL path', 'HTTP check type'],
        limitations: [
          'Aliases, redirects, upstream checks, inaccessible configuration, or a different path may cover the service.',
          'Hostname-only similarity is not treated as certainty.',
        ],
      },
    };
    const context = createAssistantContextItem('structured', {
      title: `Reliability Inbox setup: ${selected.subject}`,
      bypassLimits: true,
      data: {
        name: 'Reliability Inbox guided setup',
        task: 'guide-suggested-http-check-setup',
        evidence,
        suggestedDraft,
        setupContract: {
          beginFromSuggestedDraft: true,
          inspectWhereToolsPermit: ['real available probes', 'existing Synthetic Monitoring checks'],
          askOnlyWhenMateriallyChanging: [
            'cadence',
            'timeout',
            'regions or probes',
            'response assertion',
            'alerting intent',
          ],
          neverInvent: [
            'credentials',
            'private-network details',
            'DNS resolvers',
            'probe assignments',
            'business semantics',
          ],
          finalReview: 'Show every proposed change in one compact final configuration.',
          creationPolicy: 'Do not create or save the check until the user explicitly confirms the final configuration.',
        },
        assistantGuidance:
          'Act as a bounded Synthetic Monitoring setup guide. Start from the suggested draft, validate what tools can validate, ask only questions that materially change configuration, present a compact final configuration, and wait for explicit confirmation before creating or saving anything.',
      },
    });

    openAssistant({
      origin: ASSISTANT_ORIGIN,
      prompt: [
        `Guide me through setting up the suggested HTTP Synthetic Monitoring check for ${suggestedDraft.target}.`,
        'Begin from the attached suggested draft and evidence.',
        'Where your tools permit, inspect the real available probes and existing checks before recommending changes.',
        'Ask only for inputs that materially change cadence, timeout, regions or probes, response assertions, or alerting intent.',
        'Do not invent credentials, private-network details, DNS resolvers, probe assignments, or business semantics.',
        'Before taking action, show all changes in one compact final configuration.',
        'Do not create or save the check until I explicitly confirm that final configuration.',
      ].join(' '),
      context: [context],
      autoSend: true,
    });
  };

  return (
    <div className={styles.reviewLayout}>
      <aside className={styles.queue} aria-label="Review queue">
        <div className={styles.queueHeader}>
          <strong>Review queue</strong>
          <Badge color="blue" text={`${sortedOpportunities.length}`} />
        </div>
        {sortedOpportunities.map((opportunity, index) => (
          <button
            className={cx(styles.queueItem, { [styles.selectedQueueItem]: opportunity.id === selected.id })}
            key={opportunity.id}
            type="button"
            aria-pressed={opportunity.id === selected.id}
            onClick={() => setSelectedId(opportunity.id)}
          >
            <span className={styles.queueRank}>{index === 0 ? 'Highest priority' : `Priority ${index + 1}`}</span>
            <strong>{opportunity.subject}</strong>
            <span className={styles.queueSignals}>
              {capitalize(opportunity.value)} value · {capitalize(opportunity.confidence)} confidence
            </span>
            <span>Public HTTP traffic · {opportunity.requestRate}</span>
          </button>
        ))}
      </aside>

      <article className={styles.review}>
        <header className={styles.reviewHeader}>
          <div className={styles.recommendation}>
            <span className={styles.eyebrow}>Recommended next step</span>
            <h2>Add an HTTP check for {selected.subject}</h2>
            <p className={styles.target}>
              {selected.proposedCheck.method} {selected.proposedCheck.target}
            </p>
            <p>Review a ready-to-customize check that can continuously verify this public endpoint.</p>
            <div className={styles.decisionSignals}>
              <div>
                <Badge
                  color={selected.value === 'high' ? 'orange' : 'darkgrey'}
                  text={`${capitalize(selected.value)} value`}
                />
                <span>Observed demand and endpoint relevance make this worth reviewing.</span>
              </div>
              <div>
                <Badge
                  color={selected.confidence === 'high' ? 'green' : 'darkgrey'}
                  text={`${capitalize(selected.confidence)} confidence`}
                />
                <span>Endpoint and traffic signals agree.</span>
              </div>
            </div>
          </div>
          <div className={styles.primaryAction}>
            <Button
              icon="ai-sparkle"
              disabled={assistantDisabled}
              tooltip={assistantTooltip}
              onClick={setUpWithAssistant}
            >
              Review and customize check
            </Button>
            <span>Opening review creates nothing. You confirm before anything is saved.</span>
          </div>
        </header>

        <section className={styles.section}>
          <h3>Evidence at a glance</h3>
          <div className={styles.metrics}>
            <EvidenceMetric value={selected.requestVolume} label="requests in the last hour" />
            <EvidenceMetric value={selected.requestRate} label="observed request rate" />
            <EvidenceMetric value={selected.errorRate} label="HTTP error responses" />
            <EvidenceMetric value={selected.p99} label="p99 response time" />
          </div>
          <p className={styles.sectionSummary}>
            Recent traffic shows sustained demand with measurable availability and latency.
          </p>
          <details className={styles.disclosure}>
            <summary>Why this recommendation?</summary>
            <div className={styles.disclosureContent}>
              <p>{selected.rationale}</p>
              <p>Evidence covers the last hour and came from {formatList(selected.suggestion.evidence.families)}.</p>
            </div>
          </details>
        </section>

        <section className={styles.coverage}>
          <div className={styles.coverageStatus}>
            <Icon name="info-circle" />
            <div>
              <span className={styles.eyebrow}>Coverage status</span>
              <h3>No exact check match found in the configuration available to this experiment</h3>
              <p>Other direct or indirect coverage may still exist.</p>
            </div>
          </div>
          <details className={styles.disclosure}>
            <summary>How coverage was checked</summary>
            <div className={styles.disclosureContent}>
              <p>
                We compared the observed target, URL path, and proposed HTTP check type with the Synthetic Monitoring
                configuration available to this experiment.
              </p>
              <p>
                This result is not proof of missing coverage. Aliases, redirects, upstream checks, inaccessible
                configuration, or checks with a different path may cover the same service. Hostname-only similarity is
                not treated as certainty.
              </p>
            </div>
          </details>
        </section>

        <section className={styles.proposal}>
          <div className={styles.proposalHeader}>
            <div>
              <span className={styles.eyebrow}>Proposed check</span>
              <h3>
                {selected.proposedCheck.method} {selected.proposedCheck.target}
              </h3>
            </div>
            <Badge color="green" text="Ready to review" />
          </div>

          <div className={styles.compactConfig}>
            <Icon name="globe" />
            <div>
              <strong>
                HTTP {selected.proposedCheck.method} · Every {formatDuration(selected.proposedCheck.frequencyMs)}
              </strong>
              <span>{selected.proposedCheck.locationPolicy}</span>
            </div>
          </div>
          <details className={cx(styles.disclosure, styles.configurationDisclosure)}>
            <summary>View configuration details</summary>
            <dl className={styles.proposalSummary}>
              <div>
                <dt>Timeout</dt>
                <dd>{formatDuration(selected.proposedCheck.timeoutMs)}</dd>
              </div>
              <div>
                <dt>Expected response</dt>
                <dd>HTTP {selected.proposedCheck.validStatusCodes.join(', ')}</dd>
              </div>
              <div>
                <dt>TLS requirement</dt>
                <dd>{selected.proposedCheck.failIfNotSSL ? 'Require HTTPS' : 'Not required'}</dd>
              </div>
              <div>
                <dt>Probe / location policy</dt>
                <dd>{selected.proposedCheck.locationPolicy}</dd>
              </div>
            </dl>
          </details>
        </section>
      </article>
    </div>
  );
}

function EvidenceMetric({ value, label }: { value: string; label: string }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
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

function formatList(values: string[]) {
  return values.length > 0 ? values.join(', ').replaceAll('_', ' ') : 'available request telemetry';
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const getStyles = (theme: GrafanaTheme2) => ({
  page: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: 0,
  }),
  titleRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    '& h1': { margin: 0 },
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    margin: 0,
  }),
  reviewLayout: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
    gap: theme.spacing(2),
    alignItems: 'start',
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
    },
  }),
  queue: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    overflow: 'hidden',
  }),
  queueHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.colors.border.medium}`,
  }),
  queueItem: css({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    color: theme.colors.text.secondary,
    background: 'transparent',
    border: 0,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    textAlign: 'left',
    cursor: 'pointer',
    '&:last-child': { borderBottom: 0 },
    '&:hover': { background: theme.colors.action.hover },
    '& strong': { color: theme.colors.text.primary },
  }),
  selectedQueueItem: css({
    background: theme.colors.info.transparent,
    boxShadow: `inset 3px 0 0 ${theme.colors.info.border}`,
  }),
  queueRank: css({
    color: theme.colors.info.text,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
  }),
  queueSignals: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  review: css({
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    overflow: 'hidden',
  }),
  reviewHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    '& h2': { margin: theme.spacing(0.5, 0), fontSize: theme.typography.h3.fontSize },
    '& p': { color: theme.colors.text.secondary, margin: 0 },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      flexDirection: 'column',
    },
  }),
  recommendation: css({
    minWidth: 0,
    flex: 1,
  }),
  target: css({
    overflowWrap: 'anywhere',
    fontFamily: theme.typography.fontFamilyMonospace,
    marginBottom: `${theme.spacing(1)} !important`,
  }),
  eyebrow: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'uppercase',
  }),
  decisionSignals: css({
    display: 'flex',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
    marginTop: theme.spacing(2),
    '& > div': {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(0.75),
    },
    '& span:last-child': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    },
  }),
  primaryAction: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: theme.spacing(1),
    maxWidth: 280,
    '& span': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      textAlign: 'right',
    },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      alignItems: 'flex-start',
      maxWidth: 'none',
      '& span': { textAlign: 'left' },
    },
  }),
  section: css({
    padding: theme.spacing(2.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    '& h3': { margin: theme.spacing(0, 0, 1.5) },
  }),
  metrics: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: theme.spacing(1),
    [`@media (max-width: ${theme.breakpoints.values.lg}px)`]: {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
  }),
  metric: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    '& strong': { fontSize: theme.typography.h4.fontSize },
    '& span': { color: theme.colors.text.secondary, fontSize: theme.typography.bodySmall.fontSize },
  }),
  sectionSummary: css({
    color: theme.colors.text.secondary,
    margin: theme.spacing(1.5, 0, 0),
  }),
  coverage: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
    '& h3': { margin: theme.spacing(0.5, 0, 0), fontSize: theme.typography.h5.fontSize },
    '& p': { color: theme.colors.text.secondary, margin: 0 },
  }),
  coverageStatus: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.25),
    '& > svg': {
      color: theme.colors.info.text,
      marginTop: theme.spacing(0.25),
    },
    '& h3': { marginBottom: `${theme.spacing(0.5)} !important` },
  }),
  disclosure: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginTop: theme.spacing(1.5),
    '& summary': {
      color: theme.colors.text.link,
      cursor: 'pointer',
      fontWeight: theme.typography.fontWeightMedium,
      padding: theme.spacing(1.25, 0, 0),
    },
  }),
  disclosureContent: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0, 0, 2.5),
    '& p': { color: theme.colors.text.secondary, margin: 0 },
  }),
  proposal: css({
    borderTop: `1px solid ${theme.colors.border.medium}`,
    background: theme.colors.background.secondary,
  }),
  proposalHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    '& h3': { margin: theme.spacing(0.5, 0, 0) },
  }),
  compactConfig: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.25),
    margin: theme.spacing(0, 2.5),
    padding: theme.spacing(1.5),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    '& > svg': { color: theme.colors.info.text },
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      minWidth: 0,
    },
    '& span': { color: theme.colors.text.secondary },
  }),
  configurationDisclosure: css({
    margin: theme.spacing(1.5, 2.5, 0),
    paddingBottom: theme.spacing(1.5),
  }),
  proposalSummary: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: theme.spacing(1),
    margin: theme.spacing(1, 0, 0),
    padding: 0,
    '& > div': {
      padding: theme.spacing(1.25),
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      background: theme.colors.background.primary,
    },
    '& dt': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightBold,
    },
    '& dd': { margin: theme.spacing(0.5, 0, 0), overflowWrap: 'anywhere' },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
    },
  }),
  loading: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    minHeight: 240,
    color: theme.colors.text.secondary,
  }),
  emptyState: css({
    minHeight: 240,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(4),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    '& h2, & p': { margin: 0 },
  }),
  retryAlert: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
  }),
});
