import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HealthEvidence, HealthEvidenceKind, HealthState } from './health/checkHealth.types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';
import { Toggletip } from 'components/Toggletip';

import { useCheckHealth } from './health/CheckHealthContext';
import { CHECK_DASHBOARD_PAGE_GUTTER } from './CheckDashboardLayout.constants';

type StatusTone = 'error' | 'info' | 'success' | 'warning';

const STATUS_VISUAL: Record<HealthState, { icon: IconName; label: string; tone: StatusTone }> = {
  healthy: { icon: 'check-circle', label: 'Healthy', tone: 'success' },
  degraded: { icon: 'exclamation-triangle', label: 'Degraded', tone: 'warning' },
  unhealthy: { icon: 'exclamation-circle', label: 'Unhealthy', tone: 'error' },
  unknown: { icon: 'question-circle', label: 'Unknown', tone: 'info' },
};

/**
 * Signals are grouped by the source tier that produced them: a subscribed
 * comparison first, then a configured alert rule, then the built-in default
 * check. A small type icon denotes the tier so provenance reads at a glance.
 */
type SourceTier = 'comparison' | 'alert' | 'default';

const SOURCE_TIER: Record<SourceTier, { icon: IconName; label: string }> = {
  comparison: { icon: 'exchange-alt', label: 'Comparison' },
  alert: { icon: 'bell', label: 'Alert rule' },
  default: { icon: 'shield', label: 'Default check' },
};

function getSourceTier(kind: HealthEvidenceKind): SourceTier {
  switch (kind) {
    case 'baseline':
      return 'comparison';
    case 'alert':
      return 'alert';
    case 'slo':
    case 'guardrail':
    default:
      return 'default';
  }
}

function getStatusLabel(state: HealthState, rangeMode: AppTimeRangeMode): string {
  const base = state === 'unknown' ? 'Health unknown' : STATUS_VISUAL[state].label;

  return rangeMode === 'live' ? `${base} now` : `${base} at end of range`;
}

function getAlertsFiredLabel(count: number): string {
  return `${count} ${count === 1 ? 'alert' : 'alerts'} fired in the selected range`;
}

function orderStatusReasons(reasons: HealthEvidence[], metricIds: string[]): HealthEvidence[] {
  const metricOrder = new Map(metricIds.map((id, index) => [id, index]));

  return [...reasons].sort((left, right) => {
    const leftIndex =
      left.metricId != null ? (metricOrder.get(left.metricId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    const rightIndex =
      right.metricId != null ? (metricOrder.get(right.metricId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    // Evaluation before range so dedupe keeps the evaluation-point copy.
    return (left.scope === 'evaluation' ? 0 : 1) - (right.scope === 'evaluation' ? 0 : 1);
  });
}

function dedupeStatusReasons(reasons: HealthEvidence[]): HealthEvidence[] {
  const seenSummaries = new Set<string>();

  return reasons.filter((reason) => {
    if (seenSummaries.has(reason.summary)) {
      return false;
    }

    seenSummaries.add(reason.summary);
    return true;
  });
}

type Styles = ReturnType<typeof getStyles>;

function EvidenceTable({
  heading,
  items,
  emptyLabel,
  styles,
}: {
  heading: string;
  items: HealthEvidence[];
  emptyLabel: string;
  styles: Styles;
}) {
  const tierClass: Record<SourceTier, string> = {
    comparison: styles.tierComparison,
    alert: styles.tierAlert,
    default: styles.tierDefault,
  };
  const stateClass: Record<StatusTone, string> = {
    error: styles.stateError,
    info: styles.stateInfo,
    success: styles.stateSuccess,
    warning: styles.stateWarning,
  };

  return (
    <div className={styles.evidenceGroup}>
      <strong className={styles.evidenceHeading}>{heading}</strong>
      {items.length > 0 ? (
        <table className={styles.evidenceTable}>
          <thead>
            <tr>
              <th>Signal</th>
              <th>Source</th>
              <th>Baseline / threshold</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const tier = getSourceTier(item.kind);
              const source = SOURCE_TIER[tier];
              const stateVisual = STATUS_VISUAL[item.state];

              return (
                <tr key={item.id}>
                  <td>{item.summary}</td>
                  <td>
                    <span className={styles.sourceCell}>
                      <Icon aria-hidden className={tierClass[tier]} name={source.icon} size="xs" />
                      {source.label}
                    </span>
                  </td>
                  <td className={styles.evidenceDetailCell}>{item.detail ?? '—'}</td>
                  <td>
                    <span className={cx(styles.stateBadge, stateClass[stateVisual.tone])}>{stateVisual.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <span className={styles.evidenceEmpty}>{emptyLabel}</span>
      )}
    </div>
  );
}

export function AlertHealthSummary() {
  const styles = useStyles2(getStyles);
  const model = useCheckHealth();
  const visual = STATUS_VISUAL[model.state];
  const evaluationEvidence = model.evidence.filter((item) => item.scope === 'evaluation');
  const rangeEvidence = model.evidence.filter((item) => item.scope === 'range');
  // Keep status-bar copy in the same order as the headline metrics.
  const statusReasons = dedupeStatusReasons(
    orderStatusReasons([...model.compactReasons, ...model.rangeReasons], Object.keys(model.metrics))
  );
  const tierIconClass: Record<SourceTier, string> = {
    comparison: styles.tierComparison,
    alert: styles.tierAlert,
    default: styles.tierDefault,
  };

  return (
    <div className={cx(styles.summary, styles[visual.tone])}>
      <div aria-label="Check health" aria-live="polite" className={styles.content} role="status">
        <div className={styles.leading}>
          <Icon aria-hidden className={styles.icon} name={visual.icon} size="md" />
          <strong className={styles.label}>{getStatusLabel(model.state, model.rangeMode)}</strong>
          {statusReasons.map((reason) => {
            const tier = getSourceTier(reason.kind);

            return (
              <span
                className={reason.scope === 'range' ? styles.rangeReason : styles.reason}
                key={reason.id}
              >
                <span aria-hidden>·</span>{' '}
                <Icon aria-hidden className={cx(styles.tierIcon, tierIconClass[tier])} name={SOURCE_TIER[tier].icon} size="xs" />
                <span className={styles.srOnly}>{SOURCE_TIER[tier].label} signal: </span>
                {reason.summary}
              </span>
            );
          })}
          {model.qualifiers.map((qualifier) => (
            <span className={styles.qualifier} key={qualifier}>
              <span aria-hidden>·</span> {qualifier}
            </span>
          ))}
          <span className={styles.alertsFired}>
            <Icon aria-hidden name="bell" size="xs" />
            {getAlertsFiredLabel(model.alertFireCount)}
          </span>
        </div>
        <Toggletip
          content={
            <div className={styles.evidence}>
              <strong>Health evidence</strong>
              <EvidenceTable
                emptyLabel="No evaluation-point evidence is available."
                heading="Evaluation point"
                items={evaluationEvidence}
                styles={styles}
              />
              <EvidenceTable
                emptyLabel="No selected-range evidence is available."
                heading="Selected range"
                items={rangeEvidence}
                styles={styles}
              />
              <div className={styles.evidenceFooter}>
                <Icon aria-hidden name="bell" size="sm" />
                <span>{getAlertsFiredLabel(model.alertFireCount)}</span>
              </div>
            </div>
          }
          maxWidth="100%"
          width={560}
        >
          <button aria-label="View health evidence" className={styles.evidenceButton} type="button">
            <Icon name="list-ul" />
          </button>
        </Toggletip>
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  const toneBar = (tone: StatusTone) =>
    css({
      background: theme.colors[tone].transparent,
      borderLeft: `3px solid ${theme.colors[tone].main}`,
      color: theme.colors[tone].text,
    });

  return {
    summary: css({
      // Full-bleed tone background; page gutter indents the status content only.
      padding: theme.spacing(1, CHECK_DASHBOARD_PAGE_GUTTER),
      width: '100%',
    }),
    error: toneBar('error'),
    info: toneBar('info'),
    success: toneBar('success'),
    warning: toneBar('warning'),
    content: css({
      alignItems: 'center',
      display: 'flex',
      gap: theme.spacing(1),
      justifyContent: 'space-between',
      minWidth: 0,
    }),
    leading: css({
      alignItems: 'center',
      display: 'flex',
      flex: '1 1 auto',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5, 1),
      minWidth: 0,
    }),
    icon: css({
      flexShrink: 0,
    }),
    label: css({
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    }),
    reason: css({
      alignItems: 'center',
      color: theme.colors.text.primary,
      display: 'inline-flex',
      fontSize: theme.typography.bodySmall.fontSize,
      gap: theme.spacing(0.5),
    }),
    rangeReason: css({
      alignItems: 'center',
      color: theme.colors.text.primary,
      display: 'inline-flex',
      fontSize: theme.typography.bodySmall.fontSize,
      gap: theme.spacing(0.5),
    }),
    qualifier: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    tierIcon: css({
      flexShrink: 0,
    }),
    tierComparison: css({
      color: theme.colors.info.text,
    }),
    tierAlert: css({
      color: theme.colors.error.text,
    }),
    tierDefault: css({
      color: theme.colors.text.secondary,
    }),
    alertsFired: css({
      alignItems: 'center',
      color: theme.colors.text.secondary,
      display: 'inline-flex',
      flexShrink: 0,
      fontSize: theme.typography.bodySmall.fontSize,
      fontVariantNumeric: 'tabular-nums',
      gap: theme.spacing(0.5),
    }),
    evidenceButton: css({
      alignItems: 'center',
      background: 'transparent',
      border: 0,
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      display: 'inline-flex',
      flexShrink: 0,
      padding: theme.spacing(0.5),
    }),
    evidence: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1.5),
      minWidth: '320px',
    }),
    evidenceGroup: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    }),
    evidenceHeading: css({
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    evidenceEmpty: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    evidenceTable: css({
      borderCollapse: 'collapse',
      fontSize: theme.typography.bodySmall.fontSize,
      width: '100%',
      'th, td': {
        padding: theme.spacing(0.5, 1),
        textAlign: 'left',
        verticalAlign: 'top',
      },
      th: {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeightMedium,
        whiteSpace: 'nowrap',
      },
      'tbody td': {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
      },
      'tbody tr:last-child td': {
        borderBottom: 0,
      },
    }),
    evidenceDetailCell: css({
      color: theme.colors.text.secondary,
    }),
    sourceCell: css({
      alignItems: 'center',
      display: 'inline-flex',
      gap: theme.spacing(0.5),
      whiteSpace: 'nowrap',
    }),
    stateBadge: css({
      alignItems: 'center',
      borderRadius: theme.shape.radius.pill,
      display: 'inline-flex',
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      padding: theme.spacing(0, 0.75),
      whiteSpace: 'nowrap',
    }),
    stateError: css({
      background: theme.colors.error.transparent,
      color: theme.colors.error.text,
    }),
    stateInfo: css({
      background: theme.colors.info.transparent,
      color: theme.colors.info.text,
    }),
    stateSuccess: css({
      background: theme.colors.success.transparent,
      color: theme.colors.success.text,
    }),
    stateWarning: css({
      background: theme.colors.warning.transparent,
      color: theme.colors.warning.text,
    }),
    evidenceFooter: css({
      alignItems: 'center',
      borderTop: `1px solid ${theme.colors.border.weak}`,
      color: theme.colors.text.secondary,
      display: 'flex',
      fontSize: theme.typography.bodySmall.fontSize,
      gap: theme.spacing(0.5),
      paddingTop: theme.spacing(1),
    }),
    srOnly: css({
      border: 0,
      clip: 'rect(0, 0, 0, 0)',
      height: '1px',
      margin: '-1px',
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      whiteSpace: 'nowrap',
      width: '1px',
    }),
  };
};
