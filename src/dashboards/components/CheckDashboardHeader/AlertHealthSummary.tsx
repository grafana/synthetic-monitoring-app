import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { HealthState } from './health/checkHealth.types';
import type { AppTimeRangeMode } from 'contexts/AppTimeProvider.utils';
import { Toggletip } from 'components/Toggletip';

import { useCheckHealth } from './health/CheckHealthContext';

const STATUS_VISUAL: Record<
  HealthState,
  { icon: IconName; label: string; tone: 'error' | 'info' | 'success' | 'warning' }
> = {
  healthy: { icon: 'check-circle', label: 'Healthy', tone: 'success' },
  degraded: { icon: 'exclamation-triangle', label: 'Degraded', tone: 'warning' },
  unhealthy: { icon: 'exclamation-circle', label: 'Unhealthy', tone: 'error' },
  unknown: { icon: 'question-circle', label: 'Unknown', tone: 'info' },
};

function getStatusLabel(state: HealthState, rangeMode: AppTimeRangeMode): string {
  const base = state === 'unknown' ? 'Health unknown' : STATUS_VISUAL[state].label;

  return rangeMode === 'live' ? `${base} now` : `${base} at end of range`;
}

export function AlertHealthSummary() {
  const styles = useStyles2(getStyles);
  const model = useCheckHealth();
  const visual = STATUS_VISUAL[model.state];
  const evaluationEvidence = model.evidence.filter((item) => item.scope === 'evaluation');
  const rangeEvidence = model.evidence.filter((item) => item.scope === 'range');

  return (
    <div className={cx(styles.summary, styles[visual.tone])}>
      <div aria-label="Check health" aria-live="polite" className={styles.content} role="status">
        <div className={styles.leading}>
          <Icon aria-hidden className={styles.icon} name={visual.icon} size="md" />
          <strong className={styles.label}>{getStatusLabel(model.state, model.rangeMode)}</strong>
          {model.compactReasons.map((reason) => (
            <span className={styles.reason} key={reason.id}>
              <span aria-hidden>·</span> {reason.summary}
            </span>
          ))}
          {model.rangeReasons.slice(0, 2).map((reason) => (
            <span className={styles.rangeReason} key={reason.id}>
              <span aria-hidden>·</span> {reason.summary}
            </span>
          ))}
          {model.qualifiers.map((qualifier) => (
            <span className={styles.qualifier} key={qualifier}>
              <span aria-hidden>·</span> {qualifier}
            </span>
          ))}
        </div>
        <Toggletip
          content={
            <div className={styles.evidence}>
              <strong>Health evidence</strong>
              <strong className={styles.evidenceHeading}>Evaluation point</strong>
              {evaluationEvidence.length > 0 ? (
                <ul className={styles.evidenceList}>
                  {evaluationEvidence.map((item) => (
                    <li key={item.id}>
                      <strong>{item.summary}</strong>
                      {item.detail ? <span className={styles.evidenceDetail}>{item.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <span>No evaluation-point evidence is available.</span>
              )}
              <strong className={styles.evidenceHeading}>Selected range</strong>
              {rangeEvidence.length > 0 ? (
                <ul className={styles.evidenceList}>
                  {rangeEvidence.map((item) => (
                    <li key={item.id}>
                      <strong>{item.summary}</strong>
                      {item.detail ? <span className={styles.evidenceDetail}>{item.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <span>No selected-range evidence is available.</span>
              )}
            </div>
          }
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
  const toneBar = (tone: 'error' | 'info' | 'success' | 'warning') =>
    css({
      background: theme.colors[tone].transparent,
      borderLeft: `3px solid ${theme.colors[tone].main}`,
      color: theme.colors[tone].text,
    });

  return {
    summary: css({
      padding: theme.spacing(1, 1.5),
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
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    rangeReason: css({
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    qualifier: css({
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
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
      gap: theme.spacing(1),
      minWidth: '260px',
    }),
    evidenceList: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(1),
      margin: 0,
      paddingLeft: theme.spacing(2),
    }),
    evidenceHeading: css({
      color: theme.colors.text.primary,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
    evidenceDetail: css({
      color: theme.colors.text.secondary,
      display: 'block',
      marginTop: theme.spacing(0.25),
    }),
  };
};
