import React, { useMemo, useState } from 'react';
import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  Alert,
  Badge,
  Button,
  Combobox,
  ComboboxOption,
  Icon,
  Modal,
  Spinner,
  Stack,
  useStyles2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { ReliabilityOpportunity } from './types';
import { getUserPermissions } from 'data/permissions';

import { useReliabilityInboxSuggestions } from './data';
import { parseSuggestedCheckConfig } from './model';

type SortOrder = 'value' | 'confidence' | 'activity';

const SORT_OPTIONS: Array<ComboboxOption<SortOrder>> = [
  { label: 'Highest value first', value: 'value' },
  { label: 'Highest confidence first', value: 'confidence' },
  { label: 'Highest activity first', value: 'activity' },
];

const CONFIDENCE_SCORE = { high: 3, medium: 2, low: 1 };
const VALUE_SCORE = { high: 3, medium: 2, lower: 1 };
const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/reliability-inbox';

interface ReliabilityInboxPanelProps {
  embedded?: boolean;
  onCollapse?: () => void;
}

export function ReliabilityInboxPage() {
  const styles = useStyles2(getStyles);

  return (
    <PluginPage
      pageNav={{ text: 'Coverage opportunities' }}
      renderTitle={() => <ReliabilityInboxTitle className={styles.pageTitle} />}
    >
      <ReliabilityInboxPanel />
    </PluginPage>
  );
}

export function ReliabilityInboxPanel({ embedded = false, onCollapse }: ReliabilityInboxPanelProps) {
  const styles = useStyles2(getStyles);
  const { canWriteChecks } = getUserPermissions();
  const { isAvailable: isAssistantAvailable, isLoading: isAssistantLoading, openAssistant } = useAssistant();
  const { data: opportunities = [], isLoading, isError, refetch } = useReliabilityInboxSuggestions();
  const [sortOrder, setSortOrder] = useState<SortOrder>('value');
  const [expandedId, setExpandedId] = useState<string>();
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const visibleOpportunities = useMemo(
    () => [...opportunities].sort((a, b) => compareOpportunities(a, b, sortOrder)),
    [opportunities, sortOrder]
  );

  const assistantDisabled = !canWriteChecks || isAssistantLoading || !isAssistantAvailable || !openAssistant;
  const assistantTooltip = !canWriteChecks
    ? 'You need permission to create checks'
    : !isAssistantLoading && (!isAssistantAvailable || !openAssistant)
      ? 'Grafana Assistant is unavailable'
      : undefined;

  const requestAssistantHelp = (opportunity: ReliabilityOpportunity) => {
    if (!openAssistant) {
      return;
    }

    const suggestedConfiguration = parseSuggestedCheckConfig(opportunity.suggestion.prompt);
    const needsSetup = opportunity.readiness === 'needs-setup';
    const task = needsSetup ? 'complete the missing configuration for' : 'review and set up';
    const prompt = [
      `Help me ${task} the suggested ${opportunity.suggestion.checkType.toUpperCase()} Synthetic Monitoring check for ${opportunity.subject}.`,
      needsSetup
        ? `The recommendation is incomplete: ${opportunity.suggestion.configurationReason ?? 'required configuration is missing'}. Ask me only for the values that cannot be derived safely.`
        : 'Review the proposed configuration against the evidence, call out anything I should confirm, and help me finish setting it up.',
      'Do not invent credentials, private network details, resolvers, or probe assignments. Do not create or save the check until I explicitly confirm the final configuration.',
    ].join(' ');

    const context = createAssistantContextItem('structured', {
      title: `Reliability opportunity: ${opportunity.subject}`,
      bypassLimits: true,
      data: {
        name: 'Synthetic Monitoring Reliability Inbox recommendation',
        task: needsSetup ? 'complete-check-setup' : 'review-and-setup-check',
        target: opportunity.suggestion.target,
        checkType: opportunity.suggestion.checkType,
        readiness: opportunity.readiness,
        rationale: opportunity.rationale,
        evidence: {
          requestsPerSecond: opportunity.suggestion.evidence.reqPerS,
          estimatedRequestsInWindow: opportunity.requestVolume,
          p99Milliseconds: opportunity.suggestion.evidence.p99Ms,
          httpErrorRate: opportunity.errorRate,
          statusDistribution: opportunity.suggestion.evidence.statusDistribution,
          measurementWindow: 'last hour',
          telemetryFamilies: opportunity.suggestion.evidence.families,
        },
        coverageAnalysis: {
          status: opportunity.suggestion.dedupStatus,
          reachability: opportunity.suggestion.reachability,
          reachabilitySource: opportunity.suggestion.reachabilitySource,
          algorithms: opportunity.suggestion.algorithms,
        },
        suggestedConfiguration,
        missingConfiguration: opportunity.suggestion.configurationReason,
        assistantGuidance:
          'Act as a configuration partner for Grafana Synthetic Monitoring. Preserve the evidence-backed fields, ask for genuinely missing values, explain material tradeoffs, and wait for explicit confirmation before creating or saving a check.',
      },
    });

    openAssistant({
      origin: ASSISTANT_ORIGIN,
      prompt,
      context: [context],
      autoSend: true,
    });
  };

  return (
    <div className={styles.page}>
      {embedded && (
        <div className={styles.embeddedTitleRow}>
          <ReliabilityInboxTitle />
          {onCollapse && (
            <Button variant="secondary" fill="text" icon="angle-up" onClick={onCollapse}>
              Collapse
            </Button>
          )}
        </div>
      )}

      <div className={styles.intro}>
        <p className={styles.subtitle}>
          Endpoints with observed demand and no equivalent Synthetic Monitoring coverage.
        </p>
        <Button variant="secondary" fill="text" icon="info-circle" onClick={() => setShowHowItWorks(true)}>
          How it works
        </Button>
      </div>

      <div className={styles.controls}>
        <span className={styles.openCount}>
          {visibleOpportunities.length} open {visibleOpportunities.length === 1 ? 'opportunity' : 'opportunities'}
        </span>
        <Combobox<SortOrder>
          aria-label="Sort opportunities"
          options={SORT_OPTIONS}
          value={sortOrder}
          width={24}
          onChange={(option) => setSortOrder(option.value ?? 'value')}
        />
      </div>

      {isLoading && (
        <div className={styles.loading}>
          <Spinner />
          <span>Loading coverage opportunities…</span>
        </div>
      )}

      {isError && (
        <Alert severity="error" title="Unable to load coverage opportunities">
          <div className={styles.retryAlert}>
            <span>Check that the Reliability Inbox fixture interceptor is enabled in Graft.</span>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {!isLoading && !isError && (
        <div className={styles.queue}>
          <div className={styles.queueHeader}>
            <span>Observed opportunity</span>
            <span>Suggested action</span>
          </div>

          {visibleOpportunities.map((opportunity) => {
            const evidenceExpanded = expandedId === opportunity.id;

            return (
              <article
                className={cx(styles.opportunity, {
                  [styles.readyOpportunity]: opportunity.readiness === 'ready',
                  [styles.setupOpportunity]: opportunity.readiness === 'needs-setup',
                  [styles.expandedOpportunity]: evidenceExpanded,
                })}
                key={opportunity.id}
              >
                <div className={styles.observation}>
                  <div className={styles.opportunityTitleRow}>
                    <h2 className={styles.opportunityTitle}>Potential gap for {opportunity.subject}</h2>
                    <OpportunityBadges opportunity={opportunity} />
                  </div>
                  <p className={styles.meta}>{opportunity.observedSummary}</p>
                  <p className={styles.rationale}>
                    <strong>Why it may matter:</strong> {opportunity.rationale}
                  </p>
                </div>

                <div className={styles.action}>
                  <h3 className={styles.actionTitle}>{opportunity.actionTitle}</h3>
                  <p className={styles.meta}>{opportunity.actionSummary}</p>
                  {!evidenceExpanded && opportunity.estimatedUsage && (
                    <p className={styles.usage}>{opportunity.estimatedUsage}</p>
                  )}
                  <div className={styles.actionButtons}>
                    <Button
                      variant="secondary"
                      fill="text"
                      size="sm"
                      icon={evidenceExpanded ? 'angle-up' : 'angle-down'}
                      onClick={() => setExpandedId(evidenceExpanded ? undefined : opportunity.id)}
                    >
                      {evidenceExpanded ? 'Hide evidence' : 'View evidence'}
                    </Button>
                    {!evidenceExpanded && (
                      <AssistantActionButton
                        opportunity={opportunity}
                        disabled={assistantDisabled}
                        tooltip={assistantTooltip}
                        onClick={() => requestAssistantHelp(opportunity)}
                      />
                    )}
                  </div>
                </div>

                {evidenceExpanded && (
                  <EvidenceDetails
                    opportunity={opportunity}
                    assistantDisabled={assistantDisabled}
                    assistantTooltip={assistantTooltip}
                    onRequestAssistant={() => requestAssistantHelp(opportunity)}
                  />
                )}
              </article>
            );
          })}

          {visibleOpportunities.length === 0 && (
            <div className={styles.emptyState}>
              <Icon name="check-circle" size="xl" />
              <h3>No open opportunities</h3>
              <p>New evidence-backed coverage recommendations will appear here.</p>
            </div>
          )}
        </div>
      )}

      <p className={styles.footer}>
        Evidence expands in context so you keep your place in the prioritized queue. No check is created until you
        explicitly confirm it with Grafana Assistant.
      </p>

      <Modal isOpen={showHowItWorks} title="How coverage opportunities work" onDismiss={() => setShowHowItWorks(false)}>
        <Stack direction="column" gap={2}>
          <p>
            The experiment compares observed endpoint activity with current Synthetic Monitoring configuration and
            surfaces likely coverage gaps.
          </p>
          <p>
            Observed facts, inferred importance, and the proposed action are shown separately. Recommendations can be
            incomplete or incorrect, so Grafana Assistant reviews the evidence, asks for missing configuration, and
            waits for your confirmation before creating anything.
          </p>
        </Stack>
        <Modal.ButtonRow>
          <Button onClick={() => setShowHowItWorks(false)}>Got it</Button>
        </Modal.ButtonRow>
      </Modal>
    </div>
  );
}

function ReliabilityInboxTitle({ className }: { className?: string }) {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.titleRow, className)}>
      <h1 className={styles.title}>Potential coverage gaps</h1>
      <Badge color="blue" text="Experimental" />
    </div>
  );
}

function OpportunityBadges({ opportunity }: { opportunity: ReliabilityOpportunity }) {
  const valueLabel = opportunity.value === 'lower' ? 'Lower value' : `${capitalize(opportunity.value)} value`;
  const confidenceLabel = `${capitalize(opportunity.confidence)} confidence`;

  return (
    <div className={css({ display: 'flex', gap: 6, flexWrap: 'wrap' })}>
      <Badge color={opportunity.value === 'high' ? 'orange' : 'darkgrey'} text={valueLabel} />
      <Badge color={opportunity.confidence === 'high' ? 'green' : 'darkgrey'} text={confidenceLabel} />
      <Badge
        color={opportunity.readiness === 'ready' ? 'green' : 'orange'}
        text={opportunity.readiness === 'ready' ? 'Ready' : 'Needs setup'}
      />
    </div>
  );
}

function AssistantActionButton({
  opportunity,
  disabled,
  tooltip,
  onClick,
}: {
  opportunity: ReliabilityOpportunity;
  disabled: boolean;
  tooltip?: string;
  onClick: () => void;
}) {
  return (
    <Button icon="ai-sparkle" size="sm" disabled={disabled} tooltip={tooltip} onClick={onClick}>
      {opportunity.readiness === 'ready' ? 'Review check' : 'Complete setup'}
    </Button>
  );
}

function EvidenceDetails({
  opportunity,
  assistantDisabled,
  assistantTooltip,
  onRequestAssistant,
}: {
  opportunity: ReliabilityOpportunity;
  assistantDisabled: boolean;
  assistantTooltip?: string;
  onRequestAssistant: () => void;
}) {
  const styles = useStyles2(getStyles);
  const { suggestion } = opportunity;
  const coverageStatus = capitalize(suggestion.dedupStatus);
  const limitation =
    suggestion.configurationReason ??
    'Request telemetry cannot confirm endpoint ownership, business intent, or indirect upstream coverage.';

  return (
    <section className={styles.evidence}>
      <div className={styles.evidenceHeader}>
        <h3>Why this was recommended</h3>
        <span>Signals measured over the last hour</span>
      </div>

      <div className={styles.evidenceGrid}>
        <div className={styles.evidenceColumn}>
          <div className={styles.evidenceBlock}>
            <span className={styles.evidenceLabel}>Observed demand</span>
            <div className={styles.metricRow}>
              <strong>{opportunity.requestVolume}</strong>
              <span>requests</span>
            </div>
            <p>
              {opportunity.requestRate} · {opportunity.errorRate} HTTP error responses · {opportunity.p99} p99
            </p>
          </div>

          <div className={styles.evidenceBlock}>
            <span className={styles.evidenceLabel}>Coverage analysis</span>
            <strong className={styles.evidenceStatement}>{coverageStatus}</strong>
            <p>
              No equivalent configured check was detected. Reachability was inferred from{' '}
              {suggestion.reachabilitySource.replaceAll('_', ' ')}.
            </p>
          </div>
        </div>

        <div className={styles.evidenceColumn}>
          <div className={styles.evidenceBlock}>
            <span className={styles.evidenceLabel}>Interpretation</span>
            <strong className={styles.evidenceStatement}>{opportunity.rationale}</strong>
            <p>
              {opportunity.readiness === 'ready'
                ? 'A check could detect availability regressions before users report them.'
                : 'Grafana Assistant can preserve the evidence-backed fields and ask for the missing private-network configuration.'}
            </p>
          </div>

          <div className={styles.limitation}>
            <strong>Confidence and limitations</strong>
            <p>
              {capitalize(opportunity.confidence)} confidence. {limitation}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.evidenceFooter}>
        <span>
          Suggested check: {suggestion.checkType.toUpperCase()} · {opportunity.actionSummary}
          {opportunity.estimatedUsage ? ` · ${opportunity.estimatedUsage.replace('Estimated usage: ', '')}` : ''}
        </span>
        <AssistantActionButton
          opportunity={opportunity}
          disabled={assistantDisabled}
          tooltip={assistantTooltip}
          onClick={onRequestAssistant}
        />
      </div>
    </section>
  );
}

function compareOpportunities(a: ReliabilityOpportunity, b: ReliabilityOpportunity, order: SortOrder) {
  if (order === 'confidence') {
    return CONFIDENCE_SCORE[b.confidence] - CONFIDENCE_SCORE[a.confidence] || b.sortScore - a.sortScore;
  }
  if (order === 'activity') {
    return b.suggestion.evidence.reqPerS - a.suggestion.evidence.reqPerS;
  }
  return VALUE_SCORE[b.value] - VALUE_SCORE[a.value] || b.sortScore - a.sortScore;
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
  pageTitle: css({
    marginBottom: 0,
  }),
  embeddedTitleRow: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
  titleRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    flexWrap: 'wrap',
  }),
  title: css({
    margin: 0,
    fontSize: theme.typography.h2.fontSize,
    lineHeight: theme.typography.h2.lineHeight,
  }),
  intro: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
  subtitle: css({
    color: theme.colors.text.secondary,
    margin: 0,
  }),
  controls: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
  openCount: css({
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  loading: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    minHeight: 240,
    color: theme.colors.text.secondary,
  }),
  queue: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
    background: theme.colors.background.secondary,
  }),
  queueHeader: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1.05fr)',
    gap: theme.spacing(3),
    padding: theme.spacing(1.5, 2),
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'uppercase',
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      display: 'none',
    },
  }),
  opportunity: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1.05fr)',
    gap: theme.spacing(3),
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.medium}`,
    borderLeft: '3px solid transparent',
    '&:last-child': {
      borderBottom: 'none',
    },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
      gap: theme.spacing(2),
    },
  }),
  expandedOpportunity: css({
    paddingBottom: 0,
  }),
  readyOpportunity: css({
    borderLeftColor: theme.colors.info.border,
  }),
  setupOpportunity: css({
    borderLeftColor: theme.colors.warning.border,
  }),
  observation: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  opportunityTitleRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
  opportunityTitle: css({
    fontSize: theme.typography.h5.fontSize,
    lineHeight: theme.typography.h5.lineHeight,
    margin: 0,
  }),
  meta: css({
    color: theme.colors.text.secondary,
    margin: 0,
  }),
  rationale: css({
    color: theme.colors.text.secondary,
    margin: 0,
    '& strong': {
      color: theme.colors.text.primary,
    },
  }),
  action: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  actionTitle: css({
    fontSize: theme.typography.h5.fontSize,
    lineHeight: theme.typography.h5.lineHeight,
    margin: 0,
  }),
  usage: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
  }),
  actionButtons: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: 'auto',
    marginLeft: 'auto',
    flexWrap: 'wrap',
  }),
  evidence: css({
    gridColumn: '1 / -1',
    margin: theme.spacing(1, -2, 0),
    borderTop: `1px solid ${theme.colors.border.medium}`,
    background: theme.colors.background.primary,
  }),
  evidenceHeader: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    '& h3': {
      fontSize: theme.typography.h5.fontSize,
      lineHeight: theme.typography.h5.lineHeight,
      margin: 0,
    },
    '& span': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    },
  }),
  evidenceGrid: css({
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    padding: theme.spacing(0, 2, 2),
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
    },
  }),
  evidenceColumn: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
    padding: theme.spacing(1, 2),
    minWidth: 0,
    '& + &': {
      borderLeft: `1px solid ${theme.colors.border.weak}`,
    },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      padding: theme.spacing(1, 0),
      '& + &': {
        borderLeft: 'none',
        borderTop: `1px solid ${theme.colors.border.weak}`,
        paddingTop: theme.spacing(2),
      },
    },
  }),
  evidenceBlock: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
    color: theme.colors.text.secondary,
    '& p': {
      margin: 0,
    },
  }),
  evidenceLabel: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightBold,
    textTransform: 'uppercase',
  }),
  metricRow: css({
    display: 'flex',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    '& strong': {
      color: theme.colors.text.primary,
      fontSize: theme.typography.h2.fontSize,
      lineHeight: theme.typography.h2.lineHeight,
    },
  }),
  evidenceStatement: css({
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  limitation: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    padding: theme.spacing(1.5),
    border: `1px solid ${theme.colors.warning.border}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.warning.transparent,
    color: theme.colors.text.secondary,
    '& strong': {
      color: theme.colors.warning.text,
    },
    '& p': {
      margin: 0,
    },
  }),
  evidenceFooter: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1.25, 2),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    flexWrap: 'wrap',
  }),
  emptyState: css({
    minHeight: 220,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    color: theme.colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing(4),
    '& h3, & p': {
      margin: 0,
    },
  }),
  footer: css({
    color: theme.colors.text.disabled,
    fontSize: theme.typography.bodySmall.fontSize,
    margin: 0,
  }),
  retryAlert: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  }),
});
