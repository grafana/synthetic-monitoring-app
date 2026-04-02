import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ACTIVE_UNATTRIBUTED_MODES } from 'page/CheckList/CheckList.constants';

interface UnattributedMessageProps {
  missingCalNames: string[];
}

export const UnattributedMessage = ({ missingCalNames }: UnattributedMessageProps) => {
  const styles = useStyles2(getStyles);

  if (!ACTIVE_UNATTRIBUTED_MODES.has('inline-message') || missingCalNames.length === 0) {
    return null;
  }

  return (
    <span className={styles.message}>
      <Icon name="exclamation-triangle" size="sm" />
      Missing cost attribution labels: {missingCalNames.join(', ')}
    </span>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  message: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.warning.text,
  }),
});
