import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { IconButton, Spinner, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface TraceIconButtonProps {
  isLoading: boolean;
  isError: boolean;
  traceExists: boolean;
  isAwaitingPropagation: boolean;
  expanded: boolean;
  onToggle: () => void;
  onRetry: () => void;
  logoUrl?: string;
}

export const TraceIconButton = ({
  isLoading,
  isError,
  traceExists,
  isAwaitingPropagation,
  expanded,
  onToggle,
  onRetry,
  logoUrl,
}: TraceIconButtonProps) => {
  const styles = useStyles2(getStyles);

  if (isLoading || isAwaitingPropagation) {
    const spinner = <Spinner size="sm" />;

    return (
      <div className={styles.container} data-testid={isAwaitingPropagation ? 'trace-propagation-waiting' : undefined}>
        {isAwaitingPropagation ? (
          <Tooltip content="Waiting for trace to propagate...">
            <span>{spinner}</span>
          </Tooltip>
        ) : (
          spinner
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <IconButton name="sync" onClick={onRetry} size="md" tooltip="Retry trace lookup" />
      </div>
    );
  }

  if (!traceExists) {
    return null;
  }

  if (logoUrl) {
    return (
      <div className={styles.container}>
        <Tooltip content="View trace">
          <button type="button" onClick={onToggle} className={styles.logoButton} aria-label="View trace">
            <img src={logoUrl} alt="" width={16} height={16} />
          </button>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <IconButton name="link" onClick={onToggle} size="md" tooltip="View trace" />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }),
  logoButton: css({
    background: 'none',
    border: 'none',
    padding: theme.spacing(0.5),
    cursor: 'pointer',
    borderRadius: theme.shape.radius.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      background: theme.colors.action.hover,
    },
  }),
});
