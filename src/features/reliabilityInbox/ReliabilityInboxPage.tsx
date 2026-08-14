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
  Divider,
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
          Actionable monitoring recommendations from observed traffic, ordered by technical signals—not business
          criticality. Nothing is created without your confirmation.
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
      <aside className={styles.queue} aria-label="Review queue">
        <Box padding={1.5}>
          <Stack alignItems="center" justifyContent="space-between" gap={1}>
            <strong>Review queue</strong>
            <Badge color="blue" text={`${sortedOpportunities.length}`} />
          </Stack>
        </Box>
        {sortedOpportunities.map((opportunity, index) => (
          <button
            className={cx(styles.queueItem, { [styles.selectedQueueItem]: opportunity.id === selected.id })}
            key={opportunity.id}
            type="button"
            aria-pressed={opportunity.id === selected.id}
            onClick={() => setSelectedId(opportunity.id)}
          >
            <Stack direction="column" alignItems="flex-start" gap={0.5}>
              {index === 0 && (
                <Text variant="bodySmall" color="info" weight="bold">
                  Recommended next
                </Text>
              )}
              <Text weight="bold" truncate title={opportunity.proposedCheck.target}>
                {opportunity.subject}
              </Text>
              <Text variant="bodySmall" color="secondary">
                No matching check found
              </Text>
              <Text color="secondary">
                Public HTTP{opportunity.requestRate ? ` · ${opportunity.requestRate}` : ''}
              </Text>
            </Stack>
          </button>
        ))}
      </aside>

      <article className={styles.review}>
        <Box element="header" padding={2.5}>
          <Stack direction="column" gap={1}>
            <Text variant="bodySmall" color="secondary" weight="bold">
              Recommended next step
            </Text>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems="flex-start"
              gap={2}
            >
              <Stack direction="column" gap={1} minWidth={0} flex={1}>
                <Text element="h2" variant="h3">
                  Add an HTTP check for {selected.subject}
                </Text>
                <Stack alignItems="center" gap={1} aria-label="Recommended endpoint" minWidth={0}>
                  <Badge color="darkgrey" text={selected.proposedCheck.method} />
                  <Text truncate>{selected.subject}</Text>
                </Stack>
                <Text element="p">
                  {selected.requestVolume
                    ? `We observed ${selected.requestVolume} requests in the last hour, and no matching Synthetic Monitoring check was found.`
                    : 'We observed recent traffic, and no matching Synthetic Monitoring check was found.'}
                </Text>
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
                  Review and customize check
                </Button>
                <Text id="reliability-inbox-assistant-action-help" variant="bodySmall" color="secondary">
                  Assistant will guide setup and recommend a configuration from this proposal. Nothing is created or
                  saved until you confirm.
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Divider spacing={0} />
        <Box element="section" padding={2.5}>
          <Stack alignItems="center" justifyContent="space-between" gap={1}>
            <Text element="h3" variant="h3">
              Evidence at a glance
            </Text>
            {evidenceExploreUrl && (
              <LinkButton href={evidenceExploreUrl} icon="compass" variant="secondary">
                Investigate in Explore
              </LinkButton>
            )}
          </Stack>
          <Grid columns={{ xs: 2, lg: 4 }} gap={1}>
            {selected.requestVolume && (
              <EvidenceMetric value={selected.requestVolume} label="estimated requests in the last hour" />
            )}
            {selected.requestRate && <EvidenceMetric value={selected.requestRate} label="observed request rate" />}
            {selected.errorRate && <EvidenceMetric value={selected.errorRate} label="5xx responses" />}
            {selected.p99 && <EvidenceMetric value={selected.p99} label="p99 response time" />}
          </Grid>
          {selected.requestVolume || selected.requestRate || selected.errorRate || selected.p99 ? (
            <Text element="p" color="secondary">
              These values come from recent request telemetry.
            </Text>
          ) : (
            <Text element="p" color="secondary" role="status">
              No aggregate traffic values were returned for this suggestion.
            </Text>
          )}
        </Box>

        <Divider spacing={0} />
        <Box element="section" padding={2.5} backgroundColor="secondary">
          <Stack direction="column" gap={1}>
            <Stack alignItems="flex-start" gap={1}>
              <Icon name="info-circle" />
              <Stack direction="column" gap={0.5}>
                <Text variant="bodySmall" color="secondary" weight="bold">
                  Coverage check
                </Text>
                <Text element="h3" variant="h5">
                  No matching check found
                </Text>
              </Stack>
            </Stack>
            <details className={styles.disclosure}>
              <summary>
                <Icon name="angle-right" />
                <span>How we checked</span>
              </summary>
              <div className={styles.disclosureContent}>
                <p>We compared this endpoint and path with the HTTP checks available to us.</p>
                <p>
                  Similar or indirect monitoring may still exist through aliases, redirects, upstream checks, checks we
                  cannot access, or other paths.
                </p>
              </div>
            </details>
          </Stack>
        </Box>

        <Divider spacing={0} />
        <Box element="section" backgroundColor="secondary" paddingTop={2.5}>
          <Box paddingX={2.5}>
            <Stack direction="column" gap={0.5}>
              <Text variant="bodySmall" color="secondary" weight="bold">
                Proposed check
              </Text>
              <Text element="h3" variant="h3">
                {selected.proposedCheck.method} {selected.subject}
              </Text>
            </Stack>
          </Box>

          <Box
            marginX={2.5}
            marginTop={2}
            padding={1.5}
            borderStyle="solid"
            borderColor="weak"
            borderRadius="default"
            backgroundColor="primary"
          >
            <Stack alignItems="flex-start" gap={1}>
              <Icon name="globe" />
              <Stack direction="column" gap={0.5} minWidth={0}>
                <Text weight="bold">
                  HTTP {selected.proposedCheck.method} · Every {formatDuration(selected.proposedCheck.frequencyMs)}
                </Text>
                <Text color="secondary">{selected.proposedCheck.locationPolicy}</Text>
              </Stack>
            </Stack>
          </Box>
          <details className={cx(styles.disclosure, styles.configurationDisclosure)}>
            <summary>
              <Icon name="angle-right" />
              <span>View configuration details</span>
            </summary>
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
        </Box>
      </article>
    </div>
  );
}

function EvidenceMetric({ value, label }: { value: string; label: string }) {
  return (
    <Box padding={1.5} borderRadius="default" backgroundColor="secondary">
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
      <Badge color="blue" text="Experimental" />
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  assistantAction: getAssistantActionStyle(theme),
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
  queueItem: css({
    width: '100%',
    padding: theme.spacing(1.5),
    color: theme.colors.text.secondary,
    background: 'transparent',
    border: 0,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
    textAlign: 'left',
    cursor: 'pointer',
    '&:last-child': { borderBottom: 0 },
    '&:hover': { background: theme.colors.action.hover },
  }),
  selectedQueueItem: css({
    background: theme.colors.info.transparent,
    boxShadow: `inset 3px 0 0 ${theme.colors.info.border}`,
  }),
  review: css({
    display: 'flex',
    flexDirection: 'column',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    overflow: 'hidden',
  }),
  disclosure: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginTop: theme.spacing(1.5),
    '& summary': {
      alignItems: 'center',
      boxSizing: 'border-box',
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      display: 'flex',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      gap: theme.spacing(0.75),
      listStyle: 'none',
      padding: theme.spacing(1.25, 0),
      transition: 'background-color 0.1s ease, color 0.1s ease',
      width: '100%',
      '&::-webkit-details-marker': { display: 'none' },
      '&:hover': {
        background: theme.colors.action.hover,
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
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 0, 0, 2.5),
    '& p': { color: theme.colors.text.secondary, margin: 0 },
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
