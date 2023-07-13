import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Tag, useStyles2, useTheme2 } from '@grafana/ui';
import React from 'react';

interface Props {
  value?: number;
  label: string;
  active: boolean;
  method: string;
  onClick?: () => void;
}

export function StepPickerStepItem({ value, onClick, label, active, method }: Props) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  let color;
  if (value === undefined) {
    color = theme.colors.secondary.main;
  } else if (value < 0.01) {
    color = theme.colors.success.main;
  } else if (value < 0.05) {
    color = theme.colors.warning.main;
  } else {
    color = theme.colors.error.main;
  }

  return (
    <Button
      variant="secondary"
      fill="text"
      onClick={onClick}
      className={cx(styles.buttonWrapper, { [styles.active]: active })}
    >
      <div className={styles.container}>
        <div className={styles.value} style={{ backgroundColor: color }} />
        <Tag name={method} />
        {label}
      </div>
    </Button>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    buttonWrapper: css`
      height: 100%;
      padding-left: 0px;
    `,
    container: css`
      display: flex;
      gap: ${theme.spacing(1)};
      align-items: center;
      justify-content: flex-start;
    `,
    value: css`
      width: 6px;
      min-width: 6px;
      height: 40px;
      background-color: ${theme.colors.success.main};
    `,
    active: css`
      background-color: ${theme.colors.action.hover};
    `,
  };
};
