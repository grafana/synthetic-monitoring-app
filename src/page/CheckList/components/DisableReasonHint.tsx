import React from 'react';
import { Badge, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface DisableReasonHintProps {
  disableReason: string;
}

export const DisableReasonHint = ({ disableReason }: DisableReasonHintProps) => {
  const styles = useStyles2(getStyles);
  
  if (!disableReason) {
    return null;
  }

  return (
    <Tooltip content={disableReason}>
      <span className={styles.container}>
        <Badge text="Disabled" color="orange" icon="exclamation-triangle" />
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
