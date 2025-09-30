import React, { PropsWithChildren, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface SimpleCardProps extends PropsWithChildren {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode | ReactNode[];
}

export function SimpleCard({ children, title, actions, description }: SimpleCardProps) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.container}>
      {title && (
        <div className={styles.title}>
          <Text variant="h6">{title}</Text>
        </div>
      )}

      {description && <div className={styles.description}>{description}</div>}
      <div>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      border-radius: ${theme.shape.radius.default};
      overflow: hidden;
      margin-bottom: ${theme.spacing(2)};
      background-color: ${theme.colors.background.primary};
      padding: ${theme.spacing(2)};
    `,
    title: css`
      padding-bottom: ${theme.spacing(0.5)};
      color: ${theme.colors.text.primary};
    `,
    actions: css`
      margin-top: ${theme.spacing(1)};
      display: flex;
      gap: ${theme.spacing(1)};
      flex-wrap: wrap;
      justify-content: flex-end;
    `,
    description: css`
      color: ${theme.colors.text.secondary};
      margin-bottom: ${theme.spacing(1.5)};
    `,
    contentPadding: css`
      padding: ${theme.spacing(1)};
    `,
  };
}
