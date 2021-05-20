import { GrafanaTheme } from '@grafana/data';
import { Icon, IconName, useStyles } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import React, { PropsWithChildren } from 'react';

interface Props {
  className?: string;
  icon?: IconName;
  color: string;
  onClick?: () => void;
}

const getStyles = (color: string) => (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.panelBg};
    border-radius: 2px;
    padding: ${theme.spacing.xs} ${theme.spacing.sm};
    font-weight: ${theme.typography.weight.bold};
    font-size: ${theme.typography.size.xs};
    line-height: ${theme.typography.lineHeight.xs};
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${color};
  `,
  cursor: css`
    cursor: pointer;
  `,

  enabled: css`
    color: ${theme.palette.greenBase};
  `,
  disabled: css`
    color: ${theme.palette.red};
  `,
  icon: css`
    margin-bottom: 0px;
  `,
});

export const Pill = ({ className, icon, color, onClick, children }: PropsWithChildren<Props>) => {
  const styles = useStyles(getStyles(color));

  return (
    <div className={cx(styles.container, { [styles.cursor]: Boolean(onClick) }, className)} onClick={onClick}>
      {icon && <Icon name={icon} size="lg" className={styles.icon} />}
      <span>{children}</span>
    </div>
  );
};
