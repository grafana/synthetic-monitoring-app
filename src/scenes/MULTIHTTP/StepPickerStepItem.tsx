import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, useTheme2 } from '@grafana/ui';
import React, { PropsWithChildren } from 'react';

interface Props {
  value?: number;
  onClick?: () => void;
}

export function StepPickerStepItem({ value, onClick, children }: PropsWithChildren<Props>) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  let color;
  if (value === undefined) {
    color = theme.colors.info.main;
  } else if (value < 0.01) {
    color = theme.colors.success.main;
  } else if (value < 0.05) {
    color = theme.colors.warning.main;
  } else {
    color = theme.colors.error.main;
  }

  return (
    <div className={styles.container} onClick={onClick}>
      <div className={styles.value} style={{ backgroundColor: color }} />
      <div>{children}</div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      &hover: background-color ${theme.colors.emphasize(theme.colors.background.primary, 0.05)};
      cursor: pointer;
      display: flex;
      gap: ${theme.spacing(2)};
      align-items: center;
      justify-content: flex-start;
    `,
    value: css`
      width: 6px;
      height: 40px;
      background-color: ${theme.colors.success.main};
    `,
  };
};
