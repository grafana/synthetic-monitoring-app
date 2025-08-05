import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export function WikCard({ children }: PropsWithChildren) {
  const styles = useStyles2(getStyles);
  return <div className={styles.container}>{children}</div>;
}

function WikCardHeading({ children }: PropsWithChildren) {
  const styles = useStyles2(getStyles);
  return <div className={styles.heading}>{children}</div>;
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      background: ${theme.colors.background.secondary};
      border-radius: ${theme.shape.radius.default};
      display: flex;
      flex-direction: column;
      padding: ${theme.spacing(2)};
      margin-bottom: ${theme.spacing(1)};
    `,
    heading: css`
      display: flex;
      justify-content: space-between;
      gap: ${theme.spacing(1)};
      font-size: ${theme.typography.h6.fontSize};
      letter-spacing: inherit;
      line-height: ${theme.typography.body.lineHeight};
      color: ${theme.colors.text.primary};
      font-weight: ${theme.typography.fontWeightMedium};

      & > div {
        display: flex;
        gap: ${theme.spacing(1)};
        align-items: center;
      }
    `,
  };
}

WikCard.Heading = WikCardHeading;
