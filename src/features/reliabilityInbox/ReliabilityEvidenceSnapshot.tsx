import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ReliabilityEvidenceSnapshot as EvidenceSnapshot } from './types';

interface ReliabilityEvidenceSnapshotProps {
  evidence: EvidenceSnapshot;
}

export function ReliabilityEvidenceSnapshot({ evidence }: ReliabilityEvidenceSnapshotProps) {
  const styles = useStyles2(getStyles);

  if (!evidence.primary) {
    return (
      <div className={styles.unavailable} role="status">
        <Icon name="info-circle" />
        <span>Active public traffic was detected; detailed traffic measurements are unavailable.</span>
      </div>
    );
  }

  return (
    <div className={styles.snapshot} aria-label="Evidence summary">
      <div className={styles.metric}>
        <strong>{evidence.primary.value}</strong>
        <span>{evidence.primary.label}</span>
      </div>
      {evidence.supporting.map((metric) => (
        <React.Fragment key={`${metric.label}-${metric.value}`}>
          <span className={styles.separator} aria-hidden="true">
            ·
          </span>
          <div className={styles.metric}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        </React.Fragment>
      ))}
      <span className={styles.separator} aria-hidden="true">
        ·
      </span>
      <span className={styles.window}>{evidence.windowLabel}</span>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  snapshot: css({
    alignItems: 'baseline',
    color: theme.colors.text.secondary,
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
    lineHeight: 1.4,
    padding: theme.spacing(1.25, 0),
  }),
  metric: css({
    alignItems: 'baseline',
    display: 'inline-flex',
    gap: theme.spacing(0.5),
    '& strong': {
      color: theme.colors.text.primary,
      fontSize: theme.typography.h5.fontSize,
    },
    '& span': {
      fontSize: theme.typography.bodySmall.fontSize,
    },
  }),
  separator: css({
    color: theme.colors.text.disabled,
  }),
  window: css({
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  unavailable: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'flex',
    gap: theme.spacing(1),
    lineHeight: 1.4,
    padding: theme.spacing(1.25, 0),
    '& > svg': {
      color: theme.colors.info.text,
      flexShrink: 0,
    },
  }),
});
