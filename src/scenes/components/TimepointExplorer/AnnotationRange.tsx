import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const AnnotationRange = ({ title }: { title?: string }) => {
  const styles = useStyles2(getStyles);

  return <div className={styles.container}>{title && <div className={styles.title}>{title}</div>}</div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    flex: 1;
    background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 8px,
        ${theme.colors.border.medium} 8px,
        ${theme.colors.border.medium} 9px
      ),
      repeating-linear-gradient(
        -45deg,
        transparent,
        transparent 8px,
        ${theme.colors.border.medium} 8px,
        ${theme.colors.border.medium} 9px
      );
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  `,
  title: css`
    border: 1px solid ${theme.colors.border.medium};
    background-color: ${theme.colors.background.canvas};
    padding: ${theme.spacing(2)};
    text-align: center;
  `,
});
