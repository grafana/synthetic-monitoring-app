import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, IconName, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { PROBES_TEST_ID } from 'test/dataTestIds';

import { ProbeWithMetadata } from 'types';

/** Show offline only after probe has been down for more than this (seconds). Brief disconnects stay "online". */
const OFFLINE_GRACE_SECONDS = 60;

function isDisplayOnline(probe: ProbeWithMetadata): boolean {
  if (probe.online) {
    return true;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  const downDuration = nowSeconds - probe.onlineChange;
  return downDuration < OFFLINE_GRACE_SECONDS;
}

const STATUS_CONFIG: Record<'online' | 'offline', { icon: IconName; label: string }> = {
  online: { icon: 'heart', label: 'Online' },
  offline: { icon: 'heart-break', label: 'Offline' },
};

export function ProbeStatus({ probe }: { probe: ProbeWithMetadata }) {
  const displayOnline = isDisplayOnline(probe);
  const styles = useStyles2((theme) => getStyles(theme, displayOnline));
  const config = STATUS_CONFIG[displayOnline ? 'online' : 'offline'];
  const ariaLabel = `Probe ${probe.displayName} is ${config.label.toLowerCase()}`;

  return (
    <Tooltip
      content={
        <div data-testid={PROBES_TEST_ID.cards.statusTooltip}>
          Probe {probe.displayName} is <span className={styles.statusText}>{config.label.toLowerCase()}</span>
        </div>
      }
    >
      <span
        data-testid={PROBES_TEST_ID.cards.status}
        className={styles.container}
        role="status"
        aria-label={ariaLabel}
      >
        <Icon name={config.icon} size="sm" className={styles.icon} aria-hidden />
      </span>
    </Tooltip>
  );
}

function getStyles(theme: GrafanaTheme2, isOnline: boolean) {
  return {
    container: css({
      display: 'inline-flex',
      alignItems: 'center',
      verticalAlign: 'middle',
      marginRight: theme.spacing(0.75),
      color: isOnline ? theme.colors.success.text : theme.colors.error.text,
    }),
    icon: css({
      ...(!isOnline && {
        position: 'relative' as const,
        top: '1px',
      }),
    }),
    statusText: css({
      color: isOnline ? theme.colors.success.text : theme.colors.error.text,
    }),
  };
}
