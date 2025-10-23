import React from 'react';
import { Badge, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface DisableReasonHintProps {
  disableReason: string | null;
}

const DISABLE_REASON_MESSAGES: Record<string, string> = {
  FREE_LIMIT_EXCEEDED:
    'This check was disabled because you have exceeded the free tier limit. Upgrade your plan to re-enable checks.',
};

const DEFAULT_DISABLE_MESSAGE = 'This check has been disabled.';

export const DisableReasonHint = ({ disableReason }: DisableReasonHintProps) => {
  const styles = useStyles2(getStyles);

  if (!disableReason) {
    return null;
  }

  const userFriendlyMessage = DISABLE_REASON_MESSAGES[disableReason] || DEFAULT_DISABLE_MESSAGE;

  return (
    <Tooltip content={userFriendlyMessage}>
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
