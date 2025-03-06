import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface StatPanelProps {
  label: string;
  value: string;
}

export const StatPanel = ({ label, value }: StatPanelProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    flex-direction: column;
  `,
  label: css`
    font-size: ${theme.typography.body.fontSize};
    color: ${theme.colors.text.secondary};
  `,
  value: css`
    font-size: ${theme.typography.h1.fontSize};
    font-weight: ${theme.typography.fontWeightBold};
  `,
});
