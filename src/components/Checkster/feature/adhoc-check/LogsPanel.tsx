import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Icon, useStyles2, useTheme2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

import { AdHocResult, ProbeStateStatus } from './types.adhoc-check';

import { Preformatted } from '../../../Preformatted';

interface LogsPanelProps {
  logs: AdHocResult['line']['logs'];
  probe: string;
  state: ProbeStateStatus;
  timeseries?: AdHocResult['line']['timeseries'];
}
export function LogsPanel({ logs, state, probe, timeseries }: LogsPanelProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.wrapper}>
      <div className={cx(styles.probe, styles.backgroundHover)}>
        <div className={cx(styles.probeStatus, `LogsPanel__state-${state}`)} />
        <div className={styles.probeLabel}>
          <span>{probe}</span>
          {state === 'pending' && <Icon name="fa fa-spinner" />}
          {state === 'success' && (
            <Button
              fill="text"
              size="sm"
              variant="success"
              type="button"
              icon="gf-logs"
              onClick={() => setIsOpen(!isOpen)}
            >
              Logs: {logs.length}, Metrics: {timeseries?.length ?? 0}
            </Button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className={styles.steps}>
          {logs.map((log, index) => (
            <LogItem key={`${log.time}-${index}`} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function getLogColor(level: string, theme: GrafanaTheme2) {
  switch (level) {
    case 'info':
      return theme.colors.info.text;
    case 'warn':
      return theme.colors.warning.text;
    case 'error':
      return theme.colors.error.text;
    default:
      return theme.colors.text.secondary;
  }
}

function LogMessage({ log }: { log: AdHocResult['line']['logs'][number] }) {
  const theme = useTheme2();

  if ('check' in log) {
    const value = Number(log?.value ?? 0);
    return (
      <span>
        Check:{' '}
        <Icon
          className={css`
            color: ${value ? theme.colors.success.text : theme.colors.error.text};
          `}
          name={value ? 'times' : 'check'}
        />{' '}
        {log.check}
      </span>
    );
  }

  return (
    <span
      className={css`
        color: ${getLogColor(log.level, theme)};
      `}
    >
      {log.msg}
    </span>
  );
}

function LogItem({ log }: { log: AdHocResult['line']['logs'][number] }) {
  const { msg, ...props } = log;
  const [isOpen, setIsOpen] = useState(false);
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.logWrapper}>
      <div className={cx(styles.msg, styles.backgroundHover)} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <LogMessage log={log} />
      </div>
      <div className={styles.stepContent}>
        {isOpen && (
          <Preformatted>
            {Object.entries(props).map(([key, value]) => {
              return (
                <div key={key}>
                  {key}: <span className={styles.muted}>{value}</span>
                </div>
              );
            })}
          </Preformatted>
        )}
      </div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  const breathAnimation = keyframes`
    0% {
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3)
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
    stepContent: css`
      position: relative;
      //min-height: ${theme.spacing(2)};
      padding-left: ${theme.spacing(2)};

      &:before {
        content: '';
        border-left: 2px solid ${theme.colors.border.weak};
        position: absolute;
        left: -8px;
        top: -20px;
        border-top: 2px solid rgba(204, 204, 220, 0.12);
        width: 8px;
        bottom: -19px;
      }
    `,
    msg: css`
      display: flex;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(0.5, 1)};
      cursor: pointer;
      border-radius: ${theme.shape.radius.default};
      color: ${theme.colors.text.secondary};

      & span {
        font-family: ${theme.typography.fontFamilyMonospace};
        font-size: ${theme.typography.bodySmall.fontSize};
      }
    `,
    backgroundHover: css`
      &:hover {
        background-color: ${theme.colors.action.hover};
        transition: ${theme.transitions.create(['background-color'])};
      }
    `,
    muted: css`
      // TODO: This should be a grafana defined color (not random opacity)
      opacity: 0.6;
    `,
    probe: css`
      display: flex;
      gap: ${theme.spacing(1)};
      align-items: center;
      padding: ${theme.spacing(1)};
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
    wrapper: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
    `,
    logWrapper: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(0.5)};
    `,
  };
}
