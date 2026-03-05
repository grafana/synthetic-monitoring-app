import React, { type ReactElement } from 'react';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function ImmunityCallout(): ReactElement {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.callout}>
      <span className={styles.icon}>🔄</span>
      <span>
        <strong>Immunity loop:</strong> Incident detected → Svalinn suggests test → you approve → test runs continuously
        → you&apos;re covered for next time.
      </span>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    callout: css({
      marginTop: theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1.25),
      padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
      background: 'rgba(255, 152, 48, 0.06)',
      border: `1px dashed ${theme.colors.warning.border}`,
      borderRadius: theme.shape.radius.default,
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.warning.text,
      strong: { fontWeight: theme.typography.fontWeightBold },
    }),
    icon: css({
      fontSize: '18px',
      flexShrink: 0,
    }),
  };
}
