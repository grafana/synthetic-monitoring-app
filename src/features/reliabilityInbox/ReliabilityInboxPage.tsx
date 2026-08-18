import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createAssistantContextItem, useAssistant } from '@grafana/assistant';
import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  Alert,
  Badge,
  Box,
  Button,
  ClipboardButton,
  Grid,
  Icon,
  LinkButton,
  Spinner,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackRecommendationReviewed, trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';

import { formatDuration } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';

import { getAssistantActionStyle } from './assistantActionStyles';
import { useReliabilityInboxSuggestions } from './data';
import { getEvidenceExploreUrl } from './evidence';
import { compareReliabilityOpportunities } from './model';

const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/reliability-inbox';

export const RELIABILITY_INBOX_PAGE_NAV: NavModelItem = {
  text: 'Reliability Inbox',
  parentItem: {
    text: 'Synthetics',
    url: generateRoutePath(AppRoutes.Home),
  },
};

export function ReliabilityInboxPage() {
  return (
    <PluginPage pageNav={RELIABILITY_INBOX_PAGE_NAV} renderTitle={() => <ReliabilityInboxTitle />}>
      <Stack direction="column" gap={2}>
        <Text element="p" color="secondary">
          Review monitoring gaps discovered from recent traffic.
        </Text>
        <ReliabilityInboxReview />
      </Stack>
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

  const sortedOpportunities = useMemo(() => [...opportunities].sort(compareReliabilityOpportunities), [opportunities]);
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
      <Stack alignItems="center" justifyContent="center" gap={1} minHeight={30}>
        <Spinner />
        <Text color="secondary">Loading Reliability Inbox…</Text>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" title="Unable to load Reliability Inbox">
        <Stack alignItems="center" justifyContent="space-between" gap={2}>
          <span>Check your permissions and the live Reliability Inbox service, then try again.</span>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (!selected) {
    return (
      <Box padding={4} borderStyle="solid" borderColor="medium" borderRadius="default">
        <Stack direction="column" alignItems="center" justifyContent="center" gap={1} minHeight={30}>
          <Icon name="check-circle" size="xl" />
          <Text element="h2" variant="h2">
            No reviewable opportunities
          </Text>
          <Text element="p" color="secondary" textAlignment="center">
            Only public HTTP endpoints with enough evidence of missing coverage are shown.
          </Text>
        </Stack>
      </Box>
    );
  }

  const assistantDisabled = !canWriteChecks || isAssistantLoading || !isAssistantAvailable || !openAssistant;
  const assistantTooltip = !canWriteChecks
    ? 'You need permission to create checks'
    : !isAssistantLoading && (!isAssistantAvailable || !openAssistant)
      ? 'Grafana Assistant is unavailable'
      : undefined;
  const evidenceExploreUrl = getEvidenceExploreUrl(selected.suggestion.evidence);
  const hasAggregateEvidence = Boolean(
    selected.requestVolume || selected.requestRate || selected.errorRate || selected.p99
  );

  const setUpWithAssistant = () => {
    if (!openAssistant) {
      return;
    }

    trackSetupWithAssistant({
      opportunityId: selected.id,
      checkType: selected.proposedCheck.checkType,
    });

    const suggestedDraft = selected.proposedCheck;
    const context = createAssistantContextItem('structured', {
      title: `Reliability Inbox setup: ${selected.subject}`,
      bypassLimits: true,
      data: {
        name: 'Reliability Inbox guided setup',
        suggestion: selected.suggestion,
        suggestedDraft,
      },
    });

    openAssistant({
      origin: ASSISTANT_ORIGIN,
      prompt: [
        selected.suggestion.prompt,
        'Review this suggestion with me and inspect available probes and existing checks where possible.',
        'Do not invent credentials, private-network details, DNS resolvers, probe assignments, or business semantics.',
        'Show the final configuration and do not create or save the check until I explicitly confirm it.',
      ].join(' '),
      context: [context],
      autoSend: true,
    });
  };

  return (
    <div className={styles.reviewLayout}>
      <aside className={styles.queue} aria-label="Recommendations">
        <div className={styles.queueHeader}>
          <Stack direction="column" gap={0.5}>
            <Stack alignItems="center" justifyContent="space-between" gap={1}>
              <strong>Recommendations</strong>
              <Badge color="blue" text={`${sortedOpportunities.length}`} />
            </Stack>
            <Text variant="bodySmall" color="secondary">
              Ordered by technical signals
            </Text>
          </Stack>
        </div>
        <ol className={styles.queueList}>
          {sortedOpportunities.map((opportunity, index) => (
            <li className={styles.queueListItem} key={opportunity.id}>
              <button
                className={cx(styles.queueItem, {
                  [styles.selectedQueueItem]: opportunity.id === selected.id,
                })}
                type="button"
                aria-pressed={opportunity.id === selected.id}
                onClick={() => setSelectedId(opportunity.id)}
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

      <article className={styles.review}>
        <section
          className={cx(styles.panel, styles.recommendationPanel)}
          aria-labelledby="reliability-inbox-suggested-check-title"
        >
          <Stack direction="column" gap={1}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems="flex-start"
              gap={2}
            >
              <Stack direction="column" gap={1} minWidth={0} flex={1}>
                <Text variant="bodySmall" color="info" weight="bold">
                  Suggested check
                </Text>
                <Text element="h2" id="reliability-inbox-suggested-check-title" variant="h3">
                  Create an HTTP check
                </Text>
                <dl className={styles.endpointSummary} aria-label="Suggested check endpoint">
                  <div>
                    <dt>Method</dt>
                    <dd>
                      <Badge color="darkgrey" text={selected.proposedCheck.method} />
                    </dd>
                  </div>
                  <div className={styles.endpointTarget}>
                    <dt>Target</dt>
                    <dd title={selected.proposedCheck.target}>{selected.subject}</dd>
                  </div>
                </dl>
              </Stack>
              <Stack direction="column" alignItems={{ xs: 'flex-start', md: 'flex-end' }} gap={1} maxWidth={280}>
                <Button
                  aria-describedby="reliability-inbox-assistant-action-help"
                  className={styles.assistantAction}
                  icon="ai-sparkle"
                  disabled={assistantDisabled}
                  tooltip={assistantTooltip}
                  variant="secondary"
                  onClick={setUpWithAssistant}
                >
                  Review and customize
                </Button>
                <Text id="reliability-inbox-assistant-action-help" variant="bodySmall" color="secondary">
                  Assistant will guide setup and recommend a configuration from this proposal. Nothing is created or
                  saved until you confirm.
                </Text>
              </Stack>
            </Stack>
            <div className={styles.checkSummary}>
              <Stack alignItems="center" gap={1} wrap="wrap">
                <Badge color="darkgrey" icon="globe" text="Public HTTP" />
                <Badge
                  color="darkgrey"
                  icon="clock-nine"
                  text={`Every ${formatDuration(selected.proposedCheck.frequencyMs)}`}
                />
                {selected.proposedCheck.failIfNotSSL && <Badge color="darkgrey" icon="lock" text="Require HTTPS" />}
              </Stack>
            </div>
            <details className={styles.disclosure}>
              <summary>View configuration details</summary>
              <dl className={styles.proposalSummary}>
                <div className={styles.exactTarget}>
                  <dt>Target URL</dt>
                  <dd className={styles.targetValue}>
                    <code>{selected.proposedCheck.target}</code>
                    <ClipboardButton
                      aria-label="Copy target URL"
                      fill="text"
                      getText={() => selected.proposedCheck.target}
                      icon="clipboard-alt"
                      size="sm"
                      variant="secondary"
                    >
                      Copy
                    </ClipboardButton>
                  </dd>
                </div>
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
          </Stack>
        </section>

        <section className={styles.panel} aria-labelledby="reliability-inbox-recommendation-evidence-title">
          <Stack direction="column" gap={1.5}>
            <Stack alignItems="center" justifyContent="space-between" gap={1}>
              <Text element="h2" id="reliability-inbox-recommendation-evidence-title" variant="h3">
                Why this recommendation
              </Text>
              {evidenceExploreUrl && (
                <LinkButton href={evidenceExploreUrl} icon="compass" variant="secondary">
                  Explore telemetry
                </LinkButton>
              )}
            </Stack>
            <Text element="p">
              {selected.requestVolume
                ? `We observed ${selected.requestVolume} requests in the last hour, and no matching Synthetic Monitoring check was found.`
                : 'We observed recent traffic, and no matching Synthetic Monitoring check was found.'}
            </Text>
            <Text element="h3" variant="h4">
              Observed traffic evidence
            </Text>
            {hasAggregateEvidence && (
              <Text element="p" variant="bodySmall" color="secondary">
                Based on Prometheus telemetry from the last hour.
              </Text>
            )}
            <Grid columns={{ xs: 2, lg: 4 }} gap={1}>
              {selected.requestVolume && (
                <EvidenceMetric value={selected.requestVolume} label="estimated requests in the last hour" />
              )}
              {selected.requestRate && <EvidenceMetric value={selected.requestRate} label="observed request rate" />}
              {selected.errorRate && <EvidenceMetric value={selected.errorRate} label="5xx responses" />}
              {selected.p99 && <EvidenceMetric value={selected.p99} label="p99 response time" />}
            </Grid>
            {!hasAggregateEvidence && (
              <Text element="p" color="secondary" role="status">
                No aggregate traffic values were returned for this suggestion.
              </Text>
            )}
            <div className={styles.coverageAssessment}>
              <Text element="h3" variant="h4">
                Coverage assessment
              </Text>
              <Text element="p" color="secondary">
                We found no matching HTTP check for this endpoint and path among the checks available to us. Indirect or
                inaccessible monitoring may still exist.
              </Text>
              <details className={cx(styles.disclosure, styles.inlineDisclosure)}>
                <summary>How we checked</summary>
                <p className={styles.disclosureContent}>
                  We compared the endpoint and path with accessible HTTP checks. Aliases, redirects, upstream checks,
                  and checks for other paths may not match directly.
                </p>
              </details>
            </div>
          </Stack>
        </section>
      </article>
    </div>
  );
}

function EvidenceMetric({ value, label }: { value: string; label: string }) {
  return (
    <Box padding={1.5} borderStyle="solid" borderColor="weak" borderRadius="default" backgroundColor="secondary">
      <Stack direction="column" gap={0.5}>
        <Text variant="h4" weight="bold">
          {value}
        </Text>
        <Text variant="bodySmall" color="secondary">
          {label}
        </Text>
      </Stack>
    </Box>
  );
}

function ReliabilityInboxTitle() {
  return (
    <Stack alignItems="center" gap={1.5}>
      <h1>Reliability Inbox</h1>
      <Badge color="blue" icon="ai-sparkle" text="Experimental" />
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  assistantAction: getAssistantActionStyle(theme),
  reviewLayout: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 360px) minmax(0, 1fr)',
    gap: theme.spacing(2),
    alignItems: 'stretch',
    minHeight: `calc(100vh - ${theme.spacing(22)})`,
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
      minHeight: 'auto',
    },
  }),
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
  review: css({
    display: 'grid',
    gap: theme.spacing(2),
    minWidth: 0,
    alignSelf: 'start',
  }),
  panel: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    padding: theme.spacing(2.5),
  }),
  recommendationPanel: css({
    borderLeft: `3px solid ${theme.colors.info.border}`,
  }),
  disclosure: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginTop: theme.spacing(1.5),
    '& summary': {
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      padding: theme.spacing(1.25, 0),
      '&:hover': {
        background: theme.colors.action.hover,
        color: theme.colors.text.primary,
      },
      '&:focus-visible': {
        borderRadius: theme.shape.radius.default,
        outline: `2px solid ${theme.colors.primary.border}`,
        outlineOffset: -2,
      },
    },
  }),
  disclosureContent: css({
    color: theme.colors.text.secondary,
    margin: 0,
    padding: theme.spacing(1, 0, 0, 2.5),
  }),
  inlineDisclosure: css({
    borderTop: 0,
    marginTop: 0,
    '& summary': {
      padding: theme.spacing(0.5, 0),
    },
  }),
  endpointSummary: css({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    margin: 0,
    minWidth: 0,
    '& > div': {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.25),
      minWidth: 0,
    },
    '& dt': {
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    },
    '& dd': {
      margin: 0,
      minWidth: 0,
    },
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      gridTemplateColumns: '1fr',
    },
  }),
  endpointTarget: css({
    '& dd': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  }),
  checkSummary: css({
    alignItems: 'center',
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'flex-start',
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5),
    [`@media (max-width: ${theme.breakpoints.values.md}px)`]: {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  }),
  coverageAssessment: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    paddingTop: theme.spacing(1.5),
    '& > p': {
      margin: 0,
    },
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
