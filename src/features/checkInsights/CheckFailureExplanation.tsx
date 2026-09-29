import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { ControlledCollapse, Icon, Text, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';
import { useCheckFailureExplanation } from 'features/checkInsights/useCheckFailureExplanation';

import { Check } from 'types';

interface CheckFailureExplanationProps {
  check: Check;
}

const AI_ACCENT_COLOR = 'rgb(168, 85, 247)';

// Rendered full-width at the top of DashboardHeader, right under the page title — deliberately
// NOT inside Grafana's own PluginPage title slot (renderTitle): that container clips/constrains
// its content in ways this component doesn't own or control, which broke both the sticky
// positioning and the text truncation in practice. This container is ours end to end, so both
// actually work. No need to repeat the check name here either — the page's own <h1> already has
// it, right above.
//
// A persistent status bar, not a conditional alert: green when healthy, red when failing, so
// the pattern never jumps in and out as the check's state changes. The AI explanation is
// layered on top of that — shown only while actually failing, and only once the org has opted
// in and the LLM app is available (see useCheckFailureExplanation) — rather than being the
// reason the bar exists. Sticky (not fixed) so it keeps floating in view while scrolling.
// Clicking it expands the full sentence and the evidence behind it.
export function CheckFailureExplanation({ check }: CheckFailureExplanationProps) {
  const { isCheckFailing, showAiExplanation, explanation, isLoading, facts } = useCheckFailureExplanation(check);
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAlerts = facts.firingAlertNames.size > 0;
  const statusLabel = isCheckFailing ? (hasAlerts ? 'Alert firing' : 'Failing') : 'Healthy';
  const showExplanationSegment = showAiExplanation && (isLoading || explanation);

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.bar}
        onClick={() => setIsExpanded((open) => !open)}
        aria-expanded={isExpanded}
      >
        <span className={cx(styles.dot, isCheckFailing ? styles.dotError : styles.dotOk)} />
        <Text variant="bodySmall">{statusLabel}</Text>
        {showExplanationSegment && (
          <>
            <span className={styles.separator}>·</span>
            {isLoading ? (
              <>
                <span className={cx(styles.dot, styles.dotAi)} />
                <Text variant="bodySmall" color="secondary">
                  Investigating…
                </Text>
              </>
            ) : (
              <span className={styles.truncated}>
                <Text variant="bodySmall" color="secondary">
                  {explanation ?? ''}
                </Text>
              </span>
            )}
          </>
        )}
        <Icon name={isExpanded ? 'angle-down' : 'angle-right'} size="sm" />
      </button>
      {isExpanded && (
        <div className={styles.expanded}>
          {showAiExplanation && !isLoading && explanation && (
            <div className={styles.expandedHeader}>
              <Icon name="ai-sparkle" className={styles.icon} />
              <Text element="p" variant="h5" weight="medium">
                {explanation}
              </Text>
            </div>
          )}
          <ControlledCollapse label="Reasoning and facts" className={styles.collapse}>
            <FailureFacts facts={facts} />
          </ControlledCollapse>
        </div>
      )}
    </div>
  );
}

function FailureFacts({ facts }: { facts: ReturnType<typeof useCheckFailureExplanation>['facts'] }) {
  const styles = useStyles2(getStyles);
  const { reachabilityFraction, firingAlertNames, recentFailureLogLines } = facts;

  return (
    <div className={styles.facts}>
      <Text variant="bodySmall" color="secondary">
        {reachabilityFraction === undefined
          ? 'No recent reachability data available.'
          : `Reachability over the last 3 hours: ${(reachabilityFraction * 100).toFixed(1)}%.`}
      </Text>
      <Text variant="bodySmall" color="secondary">
        {firingAlertNames.size > 0
          ? `Firing alert(s): ${Array.from(firingAlertNames).join(', ')}.`
          : 'No alerts currently firing.'}
      </Text>
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

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.3 },
});

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    position: 'sticky',
    top: 0,
    zIndex: 1,
    width: '100%',
    marginBottom: theme.spacing(1),
  }),
  bar: css({
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '100%',
    padding: theme.spacing(1, 1.5),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.canvas,
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.colors.border.medium,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: 2,
    },
  }),
  dot: css({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  }),
  dotError: css({
    background: theme.colors.error.text,
  }),
  dotOk: css({
    background: theme.colors.success.text,
  }),
  dotAi: css({
    background: AI_ACCENT_COLOR,
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${pulse} 1.4s ease-in-out infinite`,
    },
  }),
  separator: css({
    color: theme.colors.text.disabled,
  }),
  truncated: css({
    display: 'block',
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  expanded: css({
    marginTop: theme.spacing(1),
    width: '100%',
    boxSizing: 'border-box',
    padding: theme.spacing(1.5, 2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
  }),
  expandedHeader: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
  }),
  icon: css({
    color: AI_ACCENT_COLOR,
    flexShrink: 0,
    marginTop: 2,
  }),
  collapse: css({
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    background: 'transparent',
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
