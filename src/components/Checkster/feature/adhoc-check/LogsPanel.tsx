import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Icon, Text, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

import { AdHocResult, ProbeStateStatus } from './types.adhoc-check';

import { LogItem } from './LogItem';
import { getProbeSuccess } from './utils';

interface LogsPanelProps {
  logs: AdHocResult['line']['logs'];
  probe: string;
  state: ProbeStateStatus;
  timeseries?: AdHocResult['line']['timeseries'];
}
export function LogsPanel({ logs, state, probe, timeseries }: LogsPanelProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);

  const probeState = useMemo(() => {
    return getProbeSuccess(state, timeseries);
  }, [state, timeseries]);

  return (
    <div className={styles.container}>
      <div className={cx(styles.probe, styles.backgroundHover)} onClick={() => setIsOpen(!isOpen)}>
        <div className={cx(styles.probeStatus, `LogsPanel__state-${probeState}`)} />
        <div className={styles.probeLabel}>
          <span>{probe}</span>
          {state === 'pending' && <Icon name="fa fa-spinner" />}
          {state === 'success' && (
            <Text variant="bodySmall">
              Logs: {logs?.length ?? 0}, Metrics: {timeseries?.length ?? 0}
            </Text>
          )}
          {state === ProbeStateStatus.Timeout && <Badge color="orange" text="Timed out" />}
        </div>
      </div>
      {isOpen && (
        <div className={styles.steps}>
          {!logs?.length && state === ProbeStateStatus.Pending && (
            <Text variant="bodySmall" element="span" color="secondary">
              Waiting for logs to arrive...
            </Text>
          )}
          {!logs?.length && state === ProbeStateStatus.Timeout && (
            <Text variant="bodySmall" element="span" color="warning">
              Timed out while waiting for logs.
            </Text>
          )}
          {logs?.map((log, index) => (
            <LogItem key={`${log.time}-${index}`} log={log} />
          ))}
          {!logs?.length && state === ProbeStateStatus.Success && (
            <Text variant="bodySmall" element="span" color="secondary">
              No logs were created for this check
            </Text>
          )}
        </div>
      )}
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const breathAnimation = keyframes`
    0% {
      box-shadow: 0 0 0 4px ${theme.colors.border.medium};
    }
  `;

  return {
    steps: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      margin-left: ${theme.spacing(1)};

      & > div:last-child > div:before {
        border-left: unset;
      }
    `,
    backgroundHover: css`
      &:hover {
        background-color: ${theme.colors.action.hover};
        transition: ${theme.transitions.create(['background-color'])};
      }
    `,
    probe: css`
      display: flex;
      gap: ${theme.spacing(1)};
      align-items: center;
      padding: ${theme.spacing(1)};
      cursor: pointer;
      border-radius: ${theme.shape.radius.default};
      background-color: ${theme.colors.background.secondary};
    `,
    probeStatus: css`
      border-radius: ${theme.shape.radius.circle};
      background-color: ${theme.colors.secondary.text};
      width: ${theme.spacing(1)};
      height: ${theme.spacing(1)};

      &.LogsPanel__state-pending {
        animation: ${breathAnimation} 3s linear infinite;
        z-index: 100000;
      }

      &.LogsPanel__state-success {
        background-color: ${theme.colors.success.text};
      }
      ,
      &.LogsPanel__state-error {
        background-color: ${theme.colors.error.text};
      }
      ,
      &.LogsPanel__state-timeout {
        background-color: ${theme.colors.warning.text};
      }
    `,
    probeLabel: css`
      display: flex;
      flex: 1 1 100%;
      gap: ${theme.spacing(1)};
      justify-content: space-between;
      align-items: center;
    `,
    container: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
    `,
  };
}
