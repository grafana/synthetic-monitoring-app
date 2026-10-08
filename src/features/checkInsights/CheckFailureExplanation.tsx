import React, { useState } from 'react';
import { createAssistantContextItem } from '@grafana/assistant';
import { GrafanaTheme2 } from '@grafana/data';
import { usePluginComponent } from '@grafana/runtime';
import {
  Badge,
  Button,
  Dropdown,
  Icon,
  type IconName,
  LinkButton,
  Menu,
  Stack,
  Text,
  useStyles2,
} from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';
import { useCheckFailureExplanation } from 'features/checkInsights/useCheckFailureExplanation';

import { Check } from 'types';
import { checkHasAlerting } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

interface CheckFailureExplanationProps {
  check: Check;
}

// Exposed by grafana-irm-app, not a link extension point — same shape Grafana core itself uses
// to declare an incident from the alerting UI (public/app/features/notebook/incidents).
const DECLARE_INCIDENT_COMPONENT_ID = 'grafana-irm-app/declare-incident-modal/v1';

const ASSISTANT_ORIGIN = 'grafana-synthetic-monitoring-app/check-failure-explanation';

// One place deriving the badge's color/text/icon, rather than computing it inline — mirrors
// grafana-k6-app's status->color/icon lookup (e.g. getRunStatusColorName, getTestRunBadgeIcon).
// Only ever called for a failing check: the component renders nothing otherwise (see below).
function getFailingStatusBadge(hasAlerts: boolean): { color: 'red'; text: string; icon: IconName } {
  return hasAlerts
    ? { color: 'red', text: 'Alert firing', icon: 'bell' }
    : { color: 'red', text: 'Failing', icon: 'exclamation-triangle' };
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
  const {
    isCheckFailing,
    showAiExplanation,
    explanation,
    explanationUnavailableReason,
    isLoading,
    isAssistantAvailable,
    isAssistantLoading,
    openAssistant,
    facts,
  } = useCheckFailureExplanation(check);
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const { reachabilityFraction, firingAlertNames, recentFailureLogLines, failingProbes } = facts;

  const { component: DeclareIncidentForm, isLoading: isIncidentFormLoading } = usePluginComponent<{
    onDismiss?: () => void;
    attachURL?: string;
    attachCaption?: string;
    defaultTitle?: string;
  }>(DECLARE_INCIDENT_COMPONENT_ID);

  const hasAlerts = facts.firingAlertNames.size > 0;
  const showExplanationSegment = showAiExplanation && (isLoading || explanation || explanationUnavailableReason);
  const isAssistantActionAvailable = Boolean(isAssistantAvailable && openAssistant);
  const actionsCount = (isAssistantActionAvailable ? 1 : 0) + (DeclareIncidentForm ? 1 : 0);
  // Either integration can still resolve to "available" a moment after mount (Assistant's own
  // availability check, and the IRM plugin's lazily-loaded component) — showing the real
  // button/count before both have settled would mean it can silently gain an item moments
  // after first appearing, with no skeleton covering that specific transition.
  const isActionsResolving = isAssistantLoading || isIncidentFormLoading;
  const hasActions = actionsCount > 0 || isActionsResolving;

  // Nothing to draw attention to unless the check is actually failing — stay silent rather
  // than taking up space with a badge that never has anything more to say. `isCheckFailing`
  // reads false while the reachability/alert queries are still loading (no data yet), so this
  // also means nothing appears and then disappears once they resolve to healthy.
  if (!isCheckFailing) {
    return null;
  }

  const statusBadge = getFailingStatusBadge(hasAlerts);

  const buildInvestigationPrompt = () =>
    [
      `Investigate why the Synthetic Monitoring check "${check.job}" (target: ${check.target}) is failing.`,
      reachabilityFraction !== undefined
        ? `Reachability over the last 3 hours is ${Math.round(reachabilityFraction * 100)}%.`
        : 'No recent reachability data is available.',
      firingAlertNames.size > 0
        ? `Firing alert(s): ${Array.from(firingAlertNames).join(', ')}.`
        : 'No alerts are currently firing.',
      failingProbes.length > 0 ? `Failing probe(s): ${failingProbes.join(', ')}.` : '',
    ].join(' ');

  const buildInvestigationContext = () => [
    createAssistantContextItem('structured', {
      title: `Check failure: ${check.job}`,
      data: {
        check: { job: check.job, target: check.target },
        reachabilityFraction,
        firingAlertNames: Array.from(firingAlertNames),
        failingProbes,
        recentFailureLogLines: recentFailureLogLines.map((line) => line.text),
      },
    }),
  ];

  const startInvestigation = () => {
    if (!openAssistant) {
      return;
    }

    openAssistant({
      origin: ASSISTANT_ORIGIN,
      mode: 'investigation',
      prompt: buildInvestigationPrompt(),
      context: buildInvestigationContext(),
      autoSend: true,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.statusRow}>
          <div className={styles.statusLeft}>
            <Badge color={statusBadge.color} text={statusBadge.text} icon={statusBadge.icon} />
            {showExplanationSegment && (
              <span className={styles.investigationText}>
                {isLoading ? (
                  <span className={styles.explanationSkeleton} aria-hidden="true" data-testid="explanation-skeleton" />
                ) : (
                  <Text variant="body" color="secondary">
                    — {explanation ?? explanationUnavailableReason ?? ''}
                  </Text>
                )}
              </span>
            )}
          </div>
          <div className={styles.statusRight}>
            {hasActions &&
              (isLoading || isActionsResolving ? (
                <div className={styles.actionsSkeleton} aria-hidden="true" />
              ) : (
                <Dropdown
                  overlay={
                    <Menu>
                      {isAssistantActionAvailable && (
                        <Menu.Item label="Start investigation" icon="compass" onClick={startInvestigation} />
                      )}
                      {DeclareIncidentForm && (
                        <Menu.Item label="Create incident" icon="fire" onClick={() => setIsIncidentOpen(true)} />
                      )}
                    </Menu>
                  }
                >
                  <Button size="sm" variant="secondary" icon="angle-down">
                    Actions
                  </Button>
                </Dropdown>
              ))}
          </div>
        </div>
        <div className={styles.separator} />
        <button
          type="button"
          className={styles.evidenceButton}
          onClick={() => setIsExpanded((open) => !open)}
          aria-expanded={isExpanded}
          aria-label="Evidence"
        >
          <Icon name="angle-right" size="sm" className={cx(styles.chevron, isExpanded && styles.chevronOpen)} />
          {isExpanded ? 'Hide evidence' : 'Show evidence'}
        </button>
        {isExpanded && (
          <div className={styles.expanded}>
            <FailureFacts check={check} facts={facts} />
          </div>
        )}
      </div>
      {isIncidentOpen && DeclareIncidentForm && (
        <DeclareIncidentForm
          defaultTitle={`Check "${check.job}" is failing`}
          attachURL={typeof window !== 'undefined' ? window.location.href : undefined}
          attachCaption={`Synthetic Monitoring check: ${check.job}`}
          onDismiss={() => setIsIncidentOpen(false)}
        />
      )}
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
  const { reachabilityFraction, firingAlertNames, recentFailureLogLines, failingProbes } = facts;

  return (
    <div className={styles.facts}>
      <Text variant="bodySmall">
        {reachabilityFraction === undefined ? (
          'No reachability data available.'
        ) : (
          <>
            Reachability:{' '}
            <span className={styles.secondaryInline}>{Math.round(reachabilityFraction * 100)}% over 3h</span>
          </>
        )}
      </Text>
      <Text variant="bodySmall">
        {firingAlertNames.size > 0 ? (
          <>
            Firing alert{firingAlertNames.size > 1 ? 's' : ''}:{' '}
            <span className={styles.secondaryInline}>{Array.from(firingAlertNames).join(', ')}</span>
          </>
        ) : (
          'No alerts firing.'
        )}
      </Text>
      {failingProbes.length > 0 && (
        <Text variant="bodySmall">
          Failing probe{failingProbes.length > 1 ? 's' : ''}:{' '}
          <span className={styles.secondaryInline}>{failingProbes.join(', ')}</span>
        </Text>
      )}
      {!checkHasAlerting(check) && check.id !== undefined && (
        <Stack alignItems="center" gap={1}>
          <Text variant="bodySmall">This check has no alerting configured.</Text>
          <LinkButton size="sm" variant="secondary" href={generateRoutePath(AppRoutes.EditCheck, { id: check.id })}>
            Set up alerting
          </LinkButton>
        </Stack>
      )}
      {recentFailureLogLines.length > 0 && (
        <div className={styles.logPanel}>
          <div className={styles.logPanelHeader}>Logs</div>
          <pre className={styles.logBlock}>
            {recentFailureLogLines.map((line, index) => (
              <React.Fragment key={index}>
                <span className={line.severity === 'critical' ? styles.logLineCritical : undefined}>
                  {line.text}
                </span>
                {index < recentFailureLogLines.length - 1 && '\n'}
              </React.Fragment>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(-4px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

const pulse = keyframes({
  '0%, 100%': { opacity: 0.4 },
  '50%': { opacity: 1 },
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
    padding: theme.spacing(1.5, 2, 1, 2),
  }),
  // Badge stays the headline; the explanation next to it is quiet by design (no competing
  // pill chrome). Purely informational — the action to see more lives in evidenceButton below.
  // Split into two flex groups (rather than one row with a growing spacer span) so the
  // spinner and the Actions button stay pinned to the right edge of the card even when
  // there's no explanation text yet to act as a spacer.
  statusRow: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    width: '100%',
  }),
  statusLeft: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flex: '1 1 auto',
    minWidth: 0,
  }),
  statusRight: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexShrink: 0,
  }),
  // Negative horizontal margin cancels the card's own padding, so the line runs edge to edge
  // instead of stopping at the content's inset. marginTop matches the card's own top padding,
  // so the badge row gets equal breathing room above (to the card edge) and below (to this
  // line) instead of sitting tied to the evidence row underneath it.
  separator: css({
    height: 1,
    background: theme.colors.border.weak,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(-2),
    marginRight: theme.spacing(-2),
  }),
  // A dedicated, explicitly labeled action — clearer than making the whole status row a click
  // target with no visible affordance for what clicking it does.
  evidenceButton: css({
    all: 'unset',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    cursor: 'pointer',
    borderRadius: theme.shape.radius.default,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    '&:hover': {
      color: theme.colors.text.primary,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.main}`,
      outlineOffset: 2,
    },
  }),
  // Sized to match the real Actions button's footprint, so nothing shifts when it's swapped
  // in for the actual button once the explanation resolves.
  actionsSkeleton: css({
    width: 96,
    height: 24,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${pulse} 1.5s ease-in-out infinite`,
    },
  }),
  // A single line-shaped placeholder standing in for the not-yet-known explanation text —
  // inline-block so it sits on the same line as the badge instead of dropping to its own row.
  explanationSkeleton: css({
    display: 'inline-block',
    verticalAlign: 'middle',
    width: 180,
    height: 14,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.secondary,
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${pulse} 1.5s ease-in-out infinite`,
    },
  }),
  // Truncates rather than wraps if the explanation is long — statusLeft's minWidth: 0 is what
  // lets this actually shrink below its content size instead of overflowing the row.
  investigationText: css({
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
    marginTop: theme.spacing(1),
    paddingTop: theme.spacing(1),
    [theme.transitions.handleMotion('no-preference')]: {
      animation: `${fadeIn} 150ms ease-out`,
    },
  }),
  facts: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  logPanel: css({
    marginTop: theme.spacing(1),
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  secondaryInline: css({
    color: theme.colors.text.secondary,
  }),
  // A full-width header bar attached to the top of the panel, rather than a floating tab —
  // plain box layout, no absolute positioning needed. fontWeight/lineHeight set explicitly so
  // it matches the surrounding <Text variant="bodySmall"> facts exactly, not just its font size.
  logPanelHeader: css({
    padding: theme.spacing(0.75, 1.5),
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: theme.typography.bodySmall.lineHeight,
    color: theme.colors.text.secondary,
    background: theme.colors.background.secondary,
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  logBlock: css({
    margin: 0,
    padding: theme.spacing(1, 1.5),
    background: theme.colors.background.canvas,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }),
  // The root-cause lines, so they stand out from the consequences (e.g. downstream assertion
  // failures) also shown alongside them as context.
  logLineCritical: css({
    color: theme.colors.error.text,
  }),
});
