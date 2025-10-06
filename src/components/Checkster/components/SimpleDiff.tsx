import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface SimpleDiffProps {
  original: string;
  modified: string;
}

// ?bonus

export function SimpleDiff({ original, modified }: SimpleDiffProps) {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.container}>
      <div className={cx(styles.preFormatted, styles.original)}>
        <span>-</span>
        <span>{original}</span>
      </div>
      <div className={cx(styles.preFormatted, styles.modified)}>
        <span>+</span>
        <span>{modified}</span>
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      overflow: hidden;
      width: 100%;
    `,
    original: css`
      color: ${theme.colors.error.text};
    `,
    modified: css`
      color: ${theme.colors.success.text};
    `,
    preFormatted: css`
      display: flex;
      gap: ${theme.spacing(1)};
      word-break: break-all;
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
  };
}
