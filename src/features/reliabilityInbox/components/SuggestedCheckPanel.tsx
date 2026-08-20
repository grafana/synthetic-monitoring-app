import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, ClipboardButton, IconButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { formatDuration } from 'utils';

import { getAssistantActionStyle } from '../assistantActionStyles';
import { ReliabilityOpportunity } from '../model';
import { InboxDisclosure } from './InboxDisclosure';

interface SuggestedCheckPanelProps {
  opportunity: ReliabilityOpportunity;
  assistantDisabled: boolean;
  assistantTooltip?: string;
  onDismiss: () => void;
  onSetUpWithAssistant: () => void;
}

export function SuggestedCheckPanel({
  opportunity,
  assistantDisabled,
  assistantTooltip,
  onDismiss,
  onSetUpWithAssistant,
}: SuggestedCheckPanelProps) {
  const styles = useStyles2(getStyles);
  const { proposedCheck } = opportunity;

  return (
    <section
      className={cx(styles.panel, styles.recommendationPanel)}
      aria-labelledby="reliability-inbox-suggested-check-title"
    >
      <Stack direction="column" gap={1}>
        <Stack alignItems="center" justifyContent="space-between" gap={1}>
          <Text variant="bodySmall" color="info" weight="bold">
            Suggested check
          </Text>
          <IconButton
            name="times"
            size="sm"
            variant="secondary"
            tooltip="Dismiss suggestion"
            tooltipPlacement="left"
            onClick={onDismiss}
          />
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Stack direction="column" gap={1} minWidth={0} flex={1}>
            <Text element="h2" id="reliability-inbox-suggested-check-title" variant="h3">
              Create an HTTP check
            </Text>
            <dl className={styles.endpointSummary} aria-label="Suggested check endpoint">
              <div>
                <dt>Method</dt>
                <dd>
                  <Badge color="darkgrey" text={proposedCheck.method} />
                </dd>
              </div>
              <div className={styles.endpointTarget}>
                <dt>Target</dt>
                <dd title={proposedCheck.target}>{opportunity.subject}</dd>
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
              onClick={onSetUpWithAssistant}
            >
              Review and customize
            </Button>
            <Text id="reliability-inbox-assistant-action-help" variant="bodySmall" color="secondary">
              Assistant will guide setup and recommend a configuration from this proposal. Nothing is created or saved
              until you confirm.
            </Text>
          </Stack>
        </Stack>
        <div className={styles.checkSummary}>
          <Stack alignItems="center" gap={1} wrap="wrap">
            <Badge color="darkgrey" icon="globe" text="Public HTTP" />
            <Badge color="darkgrey" icon="clock-nine" text={`Every ${formatDuration(proposedCheck.frequencyMs)}`} />
            {proposedCheck.failIfNotSSL && <Badge color="darkgrey" icon="lock" text="Require HTTPS" />}
          </Stack>
        </div>
        <InboxDisclosure summary="View configuration details">
          <dl className={styles.proposalSummary}>
            <div className={styles.exactTarget}>
              <dt>Target URL</dt>
              <dd className={styles.targetValue}>
                <code>{proposedCheck.target}</code>
                <ClipboardButton
                  aria-label="Copy target URL"
                  fill="text"
                  getText={() => proposedCheck.target}
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
              <dd>{formatDuration(proposedCheck.timeoutMs)}</dd>
            </div>
            <div>
              <dt>Expected response</dt>
              <dd>HTTP {proposedCheck.validStatusCodes.join(', ')}</dd>
            </div>
            <div>
              <dt>TLS requirement</dt>
              <dd>{proposedCheck.failIfNotSSL ? 'Require HTTPS' : 'Not required'}</dd>
            </div>
            <div>
              <dt>Probe / location policy</dt>
              <dd>{proposedCheck.locationPolicy}</dd>
            </div>
          </dl>
        </InboxDisclosure>
      </Stack>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  assistantAction: getAssistantActionStyle(theme),
  panel: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    padding: theme.spacing(2.5),
  }),
  recommendationPanel: css({
    borderLeft: `3px solid ${theme.colors.info.border}`,
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
