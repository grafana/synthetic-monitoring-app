import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, PopoverContent, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface DeprecationNoticeProps {
  tooltipContent: string | PopoverContent;
}

export const DeprecationNotice = ({ tooltipContent }: DeprecationNoticeProps) => {
  const styles = useStyles2(getStyles);

  return (
    <Tooltip interactive={true} content={tooltipContent}>
      <Icon title="deprecation-notice" name="exclamation-triangle" size="md" className={styles.deprecationWarning} />
    </Tooltip>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  deprecationWarning: css({
    marginLeft: theme.spacing(1),
    color: theme.colors.warning.text,
  }),
});
