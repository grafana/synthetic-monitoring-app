import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Button, Portal, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface DismissalToastProps {
  onUndo: () => void;
  onRemove: () => void;
}

export function DismissalToast({ onUndo, onRemove }: DismissalToastProps) {
  const styles = useStyles2(getStyles);

  return (
    <Portal>
      <Alert
        className={styles.dismissalToast}
        severity="success"
        title="Suggestion dismissed in this browser"
        elevated
        bottomSpacing={0}
        action={
          <Button variant="secondary" fill="text" size="sm" onClick={onUndo}>
            Undo
          </Button>
        }
        onRemove={onRemove}
      />
    </Portal>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  dismissalToast: css({
    position: 'fixed',
    right: theme.spacing(2),
    bottom: theme.spacing(2),
    width: `calc(100vw - ${theme.spacing(4)})`,
    maxWidth: 420,
  }),
});
