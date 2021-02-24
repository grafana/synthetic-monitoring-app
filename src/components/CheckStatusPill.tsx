import { GrafanaTheme } from '@grafana/data';
import { Icon, useStyles } from '@grafana/ui';
import { css, cx } from 'emotion';
import React from 'react';

interface Props {
  enabled: boolean;
  className?: string;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.panelBg};
    border-radius: 2px;
    padding: ${theme.spacing.xxs} ${theme.spacing.sm} ${theme.spacing.xxs} ${theme.spacing.xs};
    font-weight: ${theme.typography.weight.bold};
    font-size: ${theme.typography.size.xs};
    line-height: ${theme.typography.lineHeight.xs};
    display: flex;
    flex-direction: row;
    align-items: center;
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

export const CheckStatusPill = ({ enabled, className }: Props) => {
  const styles = useStyles(getStyles);

  return (
    <div className={cx(styles.container, className, { [styles.enabled]: enabled, [styles.disabled]: !enabled })}>
      <Icon name={enabled ? 'check' : 'times'} size="lg" className={styles.icon} />
      <span>{enabled ? 'Enabled' : 'Disabled'}</span>
    </div>
  );
};
