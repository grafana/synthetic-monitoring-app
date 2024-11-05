import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export interface ConfigContentProps extends PropsWithChildren {
  title?: NonNullable<ReactNode>;
}

export function ConfigContent({ title, children }: ConfigContentProps) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.container}>
      {title && <Text element="h4">{title}</Text>}
      {children}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    height: `calc(100% + ${theme.spacing(3)})`,
    marginTop: theme.spacing(-3),
    border: `1px ${theme.colors.border.weak} solid`,
    padding: theme.spacing(3),
    borderRadius: theme.shape.radius.default,
    borderTop: 0,
    backgroundClip: 'padding-box',
    borderStartEndRadius: 0,
    borderStartStartRadius: 0,
    backgroundColor: theme.colors.background.secondary,
    ...(theme.isDark && {
      boxShadow: `0 4px 10px rgba(0, 0, 0, 0.6)`,
    }),
  }),
});
