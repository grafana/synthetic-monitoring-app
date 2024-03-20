import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

type CollapseLabelProps = {
  label: string;
  icon?: IconName;
};

export const CollapseLabel = ({ label, icon }: CollapseLabelProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.stack}>
      <div>{label}</div>
      {icon && <Icon name={icon} size="lg" />}
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
