import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

import { logDuations } from './LogsTimeline.utils';

export const LogsTimeline = <T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>({
  logs,
  mainKey,
}: {
  logs: T[];
  mainKey: string;
}) => {
  const styles = useStyles2(getStyles);
  const withDurations = logDuations(logs);

  return (
    <div className={styles.timelineContainer}>
      {withDurations.map((log) => {
        return (
          <div key={log.id} className={styles.timelineItem}>
            <div className={styles.timelineItemLabel}>{log.labels[mainKey]}</div>
            <div className={styles.timelineItemDuration}>{formatToMsPrecision(log.durationNs)}</div>
          </div>
        );
      })}
    </div>
  );
};

function formatToMsPrecision(durationNs: number) {
  const milliseconds = durationNs / 1000000;

  if (milliseconds > 1000) {
    const seconds = milliseconds / 1000;

    return `${seconds}s`;
  }

  if (milliseconds > 1) {
    return `${Math.round(milliseconds)}ms`;
  }

  return `>1ms`;
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    timelineContainer: css`
      position: relative;
      height: 100%;
      width: 100%;
    `,
    timelineItem: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
    `,
    timelineItemLabel: css`
      color: ${theme.colors.text.secondary};
    `,
    timelineItemDuration: css`
      color: ${theme.colors.text.secondary};
    `,
  };
};
