import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useChromeHeaderHeight } from '@grafana/runtime';
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
// Clicking it expands into the same card (a divider, not a second floating box) to show the
// full sentence and the evidence behind it.
//
// `top: 0` alone silently fails here: with no scrollable ancestor, `position: sticky` sticks
// relative to the viewport itself, and Grafana's own top nav is a `position: fixed` bar sitting
// exactly at that y=0 — so a plain sticky top:0 element gets stuck *behind* it instead of
// visibly staying put. useChromeHeaderHeight() (from @grafana/runtime, despite the name — its
// own doc comment calls it "useStickyTopPadding") gives the nav's current height, which is what
// AppChrome itself uses as top padding for exactly this reason.
export function CheckFailureExplanation({ check }: CheckFailureExplanationProps) {
  const { isCheckFailing, showAiExplanation, explanation, isLoading, facts } = useCheckFailureExplanation(check);
  const chromeHeaderHeight = useChromeHeaderHeight() ?? 0;
  const styles = useStyles2(getStyles, chromeHeaderHeight);
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAlerts = facts.firingAlertNames.size > 0;
  const statusLabel = isCheckFailing ? (hasAlerts ? 'Alert firing' : 'Failing') : 'Healthy';
  const showExplanationSegment = showAiExplanation && (isLoading || explanation);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
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
          <Icon name="angle-right" size="sm" className={cx(styles.chevron, isExpanded && styles.chevronOpen)} />
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

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const getStyles = (theme: GrafanaTheme2, chromeHeaderHeight = 0) => ({
  container: css({
    position: 'sticky',
    top: chromeHeaderHeight,
    // Comfortably above ordinary panel content scrolling underneath it (VizPanel headers/menus
    // included), but well below Grafana's own chrome (mega menu, command palette, etc. all sit
    // much higher) — this only needs to win against this page's own content.
    zIndex: 2,
    width: '100%',
    marginBottom: theme.spacing(1),
  }),
  // One card, always — collapsed is just the card with only the bar visible; expanding reveals
  // more of the SAME card (a divider below), not a second floating box underneath it.
  card: css({
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    borderLeft: `3px solid ${AI_ACCENT_COLOR}`,
    background: theme.colors.background.canvas,
    boxShadow: theme.shadows.z2,
    overflow: 'hidden',
  }),
  bar: css({
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '100%',
    padding: theme.spacing(1, 1.5),
    cursor: 'pointer',
    transition: 'background 120ms ease',
    '&:hover': {
      background: theme.colors.action.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: -2,
    },
  }),
  dot: css({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background-color 200ms ease',
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
    padding: theme.spacing(1.5, 2),
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${fadeIn} 150ms ease-out`,
    },
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
