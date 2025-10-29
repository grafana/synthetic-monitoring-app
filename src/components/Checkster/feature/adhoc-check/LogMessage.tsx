import React from 'react';
import { Icon, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { LogEntry } from './types.adhoc-check';

import { CHECKSTER_TEST_ID } from '../../constants';
import { getLogColor, getMsgFromLogMsg, getMsgIconFromLog } from './utils';

export function LogMessage({ log, logLevel }: { log: LogEntry; logLevel: string }) {
  const theme = useTheme2();

  if ('check' in log) {
    const value = Number(log?.value ?? 0);
    return (
      <span>
        Check:{' '}
        <Icon
          data-testid={CHECKSTER_TEST_ID.feature.adhocCheck.LogMessage.checkIcon}
          className={css`
            color: ${value ? theme.colors.success.text : theme.colors.error.text};
          `}
          name={value ? 'check' : 'times'}
        />{' '}
        {log.check}
      </span>
    );
  }

  const iconName = getMsgIconFromLog(log);
  const upgrade = iconName === 'user' && log.level !== 'info'; // since there is no differentiating between console.log and console.info

  return (
    <span
      className={css`
        color: ${getLogColor(logLevel, theme, upgrade)};
        display: inline-flex;
        gap: ${theme.spacing(1)};
        align-items: center;
      `}
    >
      {iconName !== undefined && <Icon name={iconName} />}
      {getMsgFromLogMsg(log.msg)}
    </span>
  );
}
