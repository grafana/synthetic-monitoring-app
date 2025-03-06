import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

export const Info = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const styles = useStyles2(getStyles);

  return (
    <Stack>
      <div className={styles.label}>{label}:</div>
      <div>{children}</div>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    label: css`
      font-weight: 700;
    `,
  };
};
