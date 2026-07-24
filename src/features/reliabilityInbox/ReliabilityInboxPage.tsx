import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Alert, Badge, Button, Icon, Spinner, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import {
  trackConfigurationViewed,
  trackCreateIntent,
  trackRecommendationReviewed,
} from 'features/tracking/reliabilityInboxEvents';

import { ReliabilityOpportunity } from './types';
import { getUserPermissions } from 'data/permissions';

import { useReliabilityInboxSuggestions } from './data';
import { formatDuration, formatExecutions } from './model';

const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/reliability-inbox';

export function ReliabilityInboxPage() {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage pageNav={{ text: 'Reliability Inbox' }} renderTitle={() => <ReliabilityInboxTitle />}>
      <div className={styles.page}>
        <p className={styles.subtitle}>
          Review evidence and the exact proposed configuration before choosing whether to create a check.
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
  const [configurationVisible, setConfigurationVisible] = useState(false);
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

  useEffect(() => {
    setConfigurationVisible(false);
  }, [selected?.id]);

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

  const viewConfiguration = () => {
    setConfigurationVisible(true);
    trackConfigurationViewed({
      opportunityId: selected.id,
      checkType: selected.proposedCheck.checkType,
    });
  };

  const createWithAssistant = () => {
    if (!openAssistant) {
      return;
    }

    trackCreateIntent({
      opportunityId: selected.id,
      checkType: selected.proposedCheck.checkType,
    });

    const reviewedDraft = selected.proposedCheck;
    const context = createAssistantContextItem('structured', {
      title: `Reviewed Synthetic Monitoring check draft: ${selected.subject}`,
      bypassLimits: true,
      data: {
        name: 'Reviewed Reliability Inbox check draft',
        task: 'create-reviewed-http-check',
        reviewedDraft,
        assistantGuidance:
          'Use this reviewed structured draft exactly. Do not infer or replace configuration fields. Ask before changing any field, and require normal confirmation before saving the check.',
      },
    });

    openAssistant({
      origin: ASSISTANT_ORIGIN,
      prompt: `Create the reviewed HTTP Synthetic Monitoring check for ${reviewedDraft.target} using the attached structured draft. Do not change any reviewed field without asking me first.`,
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
            <span>{opportunity.observedSummary}</span>
          </button>
        ))}
      </aside>

      <article className={styles.review}>
        <header className={styles.reviewHeader}>
          <div>
            <span className={styles.eyebrow}>Selected recommendation</span>
            <h2>Monitor {selected.subject}</h2>
            <p>{selected.rationale}</p>
          </div>
          <div className={styles.badges}>
            <Badge
              color={selected.value === 'high' ? 'orange' : 'darkgrey'}
              text={`${capitalize(selected.value)} value`}
            />
            <Badge
              color={selected.confidence === 'high' ? 'green' : 'darkgrey'}
              text={`${capitalize(selected.confidence)} confidence`}
            />
          </div>
        </header>

        <section className={styles.section}>
          <h3>Evidence</h3>
          <div className={styles.metrics}>
            <EvidenceMetric value={selected.requestVolume} label="requests in the last hour" />
            <EvidenceMetric value={selected.requestRate} label="observed request rate" />
            <EvidenceMetric value={selected.errorRate} label="HTTP error responses" />
            <EvidenceMetric value={selected.p99} label="p99 response time" />
          </div>
          <p className={styles.sourceNote}>
            Evidence came from {formatList(selected.suggestion.evidence.families)} and covers the last hour of activity.
          </p>
        </section>

        <section className={styles.coverage}>
          <div>
            <span className={styles.eyebrow}>Coverage match</span>
            <h3>We did not find an exact matching check among the configuration we could analyze.</h3>
          </div>
          <p>
            We compared the observed target, URL path, and proposed HTTP check type with the Synthetic Monitoring
            configuration available to this experiment.
          </p>
          <p>
            This is a guarded match, not proof of missing coverage. Aliases, redirects, upstream checks, inaccessible
            configuration, or checks with a different path may cover the same service. Hostname-only similarity is not
            treated as certainty.
          </p>
        </section>

        {!configurationVisible ? (
          <div className={styles.reviewAction}>
            <div>
              <strong>Next: review the deterministic check draft</strong>
              <p>Opening the configuration does not send anything to Assistant.</p>
            </div>
            <Button icon="eye" onClick={viewConfiguration}>
              Review configuration
            </Button>
          </div>
        ) : (
          <ProposedConfiguration
            opportunity={selected}
            assistantDisabled={assistantDisabled}
            assistantTooltip={assistantTooltip}
            onCreateWithAssistant={createWithAssistant}
          />
        )}
      </article>
    </div>
  );
}

function ProposedConfiguration({
  opportunity,
  assistantDisabled,
  assistantTooltip,
  onCreateWithAssistant,
}: {
  opportunity: ReliabilityOpportunity;
  assistantDisabled: boolean;
  assistantTooltip?: string;
  onCreateWithAssistant: () => void;
}) {
  const styles = useStyles2(getStyles);
  const draft = opportunity.proposedCheck;
  const statusAssertion =
    draft.validStatusCodes.length > 0
      ? `Response status must be ${draft.validStatusCodes.join(' or ')}`
      : 'No status-code assertion';

  return (
    <section className={styles.configuration} aria-label="Proposed check configuration">
      <div className={styles.configurationHeader}>
        <div>
          <span className={styles.eyebrow}>Reviewed draft</span>
          <h3>Exact proposed check configuration</h3>
        </div>
        <Badge color="green" text="Deterministic proposal" />
      </div>

      <dl className={styles.configurationGrid}>
        <ConfigurationField label="Target" value={draft.target} />
        <ConfigurationField label="Check type" value="HTTP" />
        <ConfigurationField label="Method" value={draft.method} />
        <ConfigurationField label="Frequency" value={`Every ${formatDuration(draft.frequencyMs)}`} />
        <ConfigurationField label="Timeout" value={formatDuration(draft.timeoutMs)} />
        <ConfigurationField label="Status assertion" value={statusAssertion} />
        <ConfigurationField
          label="TLS policy"
          value={draft.failIfNotSSL ? 'Fail if the target is not served over TLS' : 'No HTTPS-only assertion'}
        />
        <ConfigurationField label="Probe / location policy" value={draft.locationPolicy} />
        <ConfigurationField
          label="Estimated executions"
          value={
            draft.estimatedExecutionsPerMonth
              ? `${formatExecutions(draft.estimatedExecutionsPerMonth)} per 30-day month`
              : 'Not available until locations are selected'
          }
        />
      </dl>

      <div className={styles.configurationFooter}>
        <p>
          Assistant receives this structured draft only when you explicitly choose{' '}
          <strong>Create with Assistant</strong>.
        </p>
        <Button
          icon="ai-sparkle"
          disabled={assistantDisabled}
          tooltip={assistantTooltip}
          onClick={onCreateWithAssistant}
        >
          Create with Assistant
        </Button>
      </div>
    </section>
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

function ConfigurationField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
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
  }),
  eyebrow: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'uppercase',
  }),
  badges: css({
    display: 'flex',
    gap: theme.spacing(0.75),
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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
  sourceNote: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: theme.spacing(1.5, 0, 0),
  }),
  coverage: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.warning.transparent,
    '& h3': { margin: theme.spacing(0.5, 0, 0), fontSize: theme.typography.h5.fontSize },
    '& p': { color: theme.colors.text.secondary, margin: 0 },
  }),
  reviewAction: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    '& p': { color: theme.colors.text.secondary, margin: theme.spacing(0.5, 0, 0) },
  }),
  configuration: css({
    borderTop: `1px solid ${theme.colors.border.medium}`,
    background: theme.colors.background.secondary,
  }),
  configurationHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2.5),
    '& h3': { margin: theme.spacing(0.5, 0, 0) },
  }),
  configurationGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: theme.spacing(0),
    margin: 0,
    padding: theme.spacing(0, 2.5, 2.5),
    '& > div': {
      padding: theme.spacing(1.25),
      border: `1px solid ${theme.colors.border.weak}`,
      margin: '-1px 0 0 -1px',
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
  configurationFooter: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    '& p': { color: theme.colors.text.secondary, margin: 0 },
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
