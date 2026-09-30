import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, type IconName, LinkButton, Spinner, Stack, Text, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';
import { useCheckFailureExplanation } from 'features/checkInsights/useCheckFailureExplanation';

import { Check } from 'types';
import { checkHasAlerting } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

interface CheckFailureExplanationProps {
  check: Check;
}

const AI_ACCENT_COLOR = 'rgb(168, 85, 247)';

// One place deriving the badge's color/text/icon from status, rather than computing it inline —
// mirrors grafana-k6-app's status->color/icon lookup (e.g. getRunStatusColorName,
// getTestRunBadgeIcon), just with a much smaller state space. The pending/loading case is
// handled separately by the caller (a skeleton, not a badge — no real status to report yet).
function getCheckStatusBadge(
  isCheckFailing: boolean,
  hasAlerts: boolean
): { color: 'red' | 'green'; text: string; icon: IconName } {
  if (isCheckFailing) {
    return hasAlerts
      ? { color: 'red', text: 'Alert firing', icon: 'bell' }
      : { color: 'red', text: 'Failing', icon: 'exclamation-triangle' };
  }
  return { color: 'green', text: 'Healthy', icon: 'check' };
}

// Rendered right under the page title (which already has the check name — no need to repeat
// it here) — but deliberately outside Grafana's own PluginPage title slot (renderTitle): that
// container clips/constrains its content in ways this component doesn't own or control, which
// broke text truncation in practice.
//
// A persistent status badge (red/green, so it never jumps in and out as state changes), with
// the AI explanation layered on top as quiet secondary text — shown only while actually
// failing, and only once the org has opted in and the LLM app is available (see
// useCheckFailureExplanation) — rather than being the reason the bar exists. Clicking it
// expands to show the full explanation sentence and the evidence behind it.
export function CheckFailureExplanation({ check }: CheckFailureExplanationProps) {
  const { isCheckFailing, isStatusLoading, showAiExplanation, explanation, isLoading, facts } =
    useCheckFailureExplanation(check);
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAlerts = facts.firingAlertNames.size > 0;
  const statusBadge = getCheckStatusBadge(isCheckFailing, hasAlerts);
  const showExplanationSegment = showAiExplanation && (isLoading || explanation);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button
          type="button"
          className={styles.metaBar}
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          disabled={isStatusLoading}
        >
          {!isStatusLoading && (
            <Icon name="angle-right" size="sm" className={cx(styles.chevron, isExpanded && styles.chevronOpen)} />
          )}
          {isStatusLoading ? (
            // The health state itself isn't known yet, so don't default to a healthy-looking
            // badge that would just flash and flip to failing once the queries resolve.
            <span className={styles.skeleton} style={{ width: 70, flexShrink: 0 }} />
          ) : (
            <Badge color={statusBadge.color} text={statusBadge.text} icon={statusBadge.icon} />
          )}
          {showExplanationSegment && (
            <span className={styles.investigation}>
              {isLoading ? (
                <Spinner size={12} className={styles.spinner} />
              ) : (
                <Icon name="ai-sparkle" size="sm" className={styles.icon} />
              )}
              <span className={styles.investigationText}>
                <Text variant="body" weight="medium">
                  {isLoading ? 'Investigating…' : explanation ?? ''}
                </Text>
              </span>
            </span>
          )}
        </button>
        {isExpanded && !isStatusLoading && (
          <div className={styles.expanded}>
            <FailureFacts check={check} facts={facts} />
          </div>
        )}
      </div>
    </div>
  );
}

function FailureFacts({
  check,
  facts,
}: {
  check: Check;
  facts: ReturnType<typeof useCheckFailureExplanation>['facts'];
}) {
  const styles = useStyles2(getStyles);
  const { reachabilityFraction, firingAlertNames, recentFailureLogLines } = facts;

  return (
    <div className={styles.facts}>
      <Text variant="bodySmall" color="secondary">
        {reachabilityFraction === undefined
          ? 'No reachability data available.'
          : `Reachability last 3 hours: ${(reachabilityFraction * 100).toFixed(1)}%.`}
      </Text>
      <Text variant="bodySmall" color="secondary">
        {firingAlertNames.size > 0
          ? `Firing alert(s): ${Array.from(firingAlertNames).join(', ')}.`
          : 'No alerts currently firing.'}
      </Text>
      {!checkHasAlerting(check) && check.id !== undefined && (
        <Stack alignItems="center" gap={1}>
          <Text variant="bodySmall" color="secondary">
            This check has no alerting configured.
          </Text>
          <LinkButton size="sm" variant="secondary" href={generateRoutePath(AppRoutes.EditCheck, { id: check.id })}>
            Set up alerting
          </LinkButton>
        </Stack>
      )}
      {recentFailureLogLines.length > 0 && (
        <>
          <Text variant="bodySmall" color="secondary">
            Recent failing execution log lines used as evidence:
          </Text>
          <pre className={styles.logBlock}>{recentFailureLogLines.join('\n')}</pre>
        </>
      )}
    </div>
  );
}

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    width: '100%',
    marginBottom: theme.spacing(1),
  }),
  // A thin border/background so the badge and explanation read as one designed unit, not
  // floating text — the badge itself already carries the health signal, so the border stays
  // neutral rather than repeating it.
  card: css({
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.primary,
    padding: theme.spacing(1.5, 2),
  }),
  // Badge stays the headline; everything else on this row is quiet by design (no competing
  // pill chrome). Still a button, since clicking anywhere along it expands the full explanation
  // and evidence below.
  metaBar: css({
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '100%',
    cursor: 'pointer',
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(0.5, 0),
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: 2,
    },
    '&:disabled': {
      cursor: 'default',
    },
  }),
  skeleton: css({
    display: 'inline-block',
    height: 20,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    animationName: fadeIn,
    animationDuration: '100ms',
    animationTimingFunction: 'ease-in',
    animationFillMode: 'backwards',
    animationDelay: '100ms',
  }),
  spinner: css({
    color: AI_ACCENT_COLOR,
    flexShrink: 0,
  }),
  // Fills the remaining space to the right of the meta text, same as the resolved explanation
  // would, so the row reads with the same width whether it's investigating or done.
  investigation: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flex: '1 1 auto',
    minWidth: 0,
  }),
  investigationText: css({
    display: 'block',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  chevron: css({
    flexShrink: 0,
    transition: 'transform 150ms ease',
    [theme.transitions.handleMotion('no-preference')]: {
      transition: 'transform 150ms ease',
    },
  }),
  chevronOpen: css({
    transform: 'rotate(90deg)',
  }),
  expanded: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${fadeIn} 150ms ease-out`,
    },
  }),
  icon: css({
    color: AI_ACCENT_COLOR,
    flexShrink: 0,
  }),
  facts: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  logBlock: css({
    margin: 0,
    padding: theme.spacing(1, 1.5),
    background: theme.colors.background.canvas,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
});
