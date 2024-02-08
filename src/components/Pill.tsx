import React, { PropsWithChildren } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

interface Props {
  className?: string;
  icon?: IconName;
  color: string;
  onClick?: () => void;
}

const getStyles = (color: string) => (theme: GrafanaTheme2) => ({
  container: css`
    background-color: ${theme.colors.background.primary};
    border-radius: 2px;
    padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
    font-weight: ${theme.typography.fontWeightBold};
    font-size: 0.75rem;
    line-height: ${theme.typography.bodySmall.lineHeight};
    display: flex;
    flex-direction: row;
    align-items: center;
    color: ${color};
  `,
  cursor: css`
    cursor: pointer;
  `,

  enabled: css`
    color: ${theme.colors.success.main};
  `,
  disabled: css`
    color: ${theme.colors.error.main};
  `,
  icon: css`
    margin-bottom: 0px;
  `,
});

export const Pill = ({ className, icon, color, onClick, children }: PropsWithChildren<Props>) => {
  const styles = useStyles2(getStyles(color));

  return (
    <div className={cx(styles.container, { [styles.cursor]: Boolean(onClick) }, className)} onClick={onClick}>
      {icon && <Icon name={icon} size="lg" className={styles.icon} />}
      <span>{children}</span>
    </div>
  );
};
