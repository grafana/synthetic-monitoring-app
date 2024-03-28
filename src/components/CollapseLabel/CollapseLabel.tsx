import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

type CollapseLabelProps = {
  label: string;
  icon?: IconName;
  iconColor?: string;
};

export const CollapseLabel = ({ label, icon, iconColor }: CollapseLabelProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stack}>
      <div>{label}</div>
      {icon && <Icon name={icon} size="lg" color={iconColor} />}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  stack: css({
    alignItems: `center`,
    display: `flex`,
    gap: theme.spacing(1),
  }),
});
