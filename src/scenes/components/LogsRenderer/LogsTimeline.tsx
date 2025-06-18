import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { HTTPResponseTimings } from 'features/parseCheckLogs/checkLogs.types.http';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { formatSmallDurations } from 'utils';
import { LogHTTPResponseTimings } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings';
import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLabels';

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
      {withDurations.map((log, index) => {
        return (
          <div key={log.id} className={styles.timelineItem}>
            <div className={styles.time}>
              {dateTimeFormat(log[LokiFieldNames.Time], {
                defaultWithMS: true,
              })}
            </div>
            <div className={styles.timelineItemLabel}>{log.labels[mainKey]}</div>
            <div className={styles.timelineItemLabel}>
              <LabelRenderer log={logs[index]} mainKey={mainKey} />
            </div>
            <div className={styles.timelineItemDuration}>{formatSmallDurations(log.durationNs / 1000000)}</div>
          </div>
        );
      })}
    </div>
  );
};

const MSG_MAP = {
  [MSG_STRINGS_HTTP.ResponseTimings]: LogHTTPResponseTimings,
};

const LabelRenderer = ({
  log,
  mainKey,
}: {
  log: ParsedLokiRecord<Record<string, string>, Record<string, string>>;
  mainKey: string;
}) => {
  const Component = MSG_MAP[log.labels[mainKey]];

  if (Component) {
    return <Component log={log as unknown as HTTPResponseTimings} />;
  }

  return <UniqueLogLabels log={log} />;
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    timelineContainer: css`
      position: relative;
      height: 100%;
      width: 100%;
    `,
    timelineItem: css`
      display: grid;
      grid-template-columns: 200px 300px 1fr 50px;
      align-items: center;
      gap: ${theme.spacing(1)};
      border-bottom: 1px solid ${theme.colors.border.medium};
    `,
    timelineItemLabel: css`
      color: ${theme.colors.text.secondary};
      flex: 1;
    `,
    timelineItemDuration: css`
      color: ${theme.colors.text.secondary};
    `,
    time: css`
      color: ${theme.colors.text.secondary};
      font-family: ${theme.typography.fontFamilyMonospace};
    `,
    uniqueLabels: css`
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(1)};
    `,
  };
};
