import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function KnowledgeGraphConnectionMatch({ children }: { children: ReactNode }) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.matchIndicator}>
      <Icon name="check-circle" size="sm" />
      <span>{children}</span>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  matchIndicator: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.success.text,
  }),
});
