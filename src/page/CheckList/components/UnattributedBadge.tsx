import React from 'react';
import { Badge, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ACTIVE_UNATTRIBUTED_MODES } from 'page/CheckList/CheckList.constants';

interface UnattributedBadgeProps {
  missingCalNames: string[];
}

export const UnattributedBadge = ({ missingCalNames }: UnattributedBadgeProps) => {
  const styles = useStyles2(getStyles);

  if (!ACTIVE_UNATTRIBUTED_MODES.has('badge') || missingCalNames.length === 0) {
    return null;
  }

  const tooltipContent = `Missing cost attribution labels: ${missingCalNames.join(', ')}`;

  return (
    <Tooltip content={tooltipContent}>
      <span className={styles.container}>
        <Badge text="Unattributed" color="orange" icon="exclamation-triangle" />
      </span>
    </Tooltip>
  );
};

const getStyles = () => ({
  container: css({
    display: 'inline-flex',
    alignItems: 'center',
  }),
});
