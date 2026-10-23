import React, { ReactNode, useEffect, useRef } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, IconButton, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

interface Props {
  label: string;
  labelId: string;
  icon: IconName;
  disabled?: boolean;
  autoFocus?: boolean;
  ready?: boolean;
  onRemove: () => void;
  children: ReactNode;
}

export function KnowledgeGraphConnectionRow({
  label,
  labelId,
  icon,
  disabled,
  autoFocus = false,
  ready = true,
  onRemove,
  children,
}: Props) {
  const styles = useStyles2(getStyles);
  const rowRef = useRef<HTMLDivElement>(null);
  const focusState = useRef(autoFocus ? 'requested' : 'done');

  useEffect(() => {
    if (focusState.current === 'done' || disabled) {
      return;
    }
    // Let the Add connection menu close before moving focus into the new row.
    const frame = requestAnimationFrame(() => {
      const row = rowRef.current;
      if (!row) {
        return;
      }
      if (focusState.current === 'waiting' && document.activeElement !== row) {
        focusState.current = 'done';
        return;
      }
      if (!ready) {
        row.focus();
        focusState.current = 'waiting';
        return;
      }
      row.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)')?.focus();
      focusState.current = 'done';
    });
    return () => cancelAnimationFrame(frame);
  }, [disabled, ready]);

  return (
    <div ref={rowRef} role="group" aria-labelledby={labelId} aria-busy={!ready} tabIndex={-1} className={styles.row}>
      <Stack alignItems="center" gap={1}>
        <Icon name={icon} size="sm" />
        <Text variant="bodySmall" weight="medium">
          <span id={labelId}>{label}</span>
        </Text>
      </Stack>
      <div className={styles.fields}>{children}</div>
      <IconButton
        className={styles.remove}
        name="times"
        tooltip={`Remove ${label.toLowerCase()} connection`}
        disabled={disabled}
        onClick={onRemove}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: theme.spacing(1),
  }),
  fields: css({ gridColumn: '1 / -1', minWidth: 0 }),
  remove: css({ gridColumn: 2, gridRow: 1, margin: 0 }),
});
