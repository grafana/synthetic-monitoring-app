import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const Indent = ({ children }: { children: ReactNode }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div />
      {children}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: `grid`,
    gridTemplateColumns: `${theme.spacing(4)} 1fr`,
    gap: theme.spacing(1),
  }),
});
