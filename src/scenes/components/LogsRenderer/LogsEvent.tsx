import React, { useMemo } from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Box, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { MSG_STRINGS_HTTP } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { HTTPResponseTimingsLog } from 'features/parseCheckLogs/checkLogs.types.http';
import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogHTTPResponseTimings } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings';
import { UniqueLogLabels } from 'scenes/components/LogsRenderer/UniqueLogLabels';

export const LogsEvent = <T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>({
  logs,
  mainKey,
  errorLogsOnly,
  onErrorLogsOnlyChange,
}: {
  logs: T[];
  mainKey: string;
  errorLogsOnly: boolean;
  onErrorLogsOnlyChange: (value: boolean) => void;
}) => {
  const styles = useStyles2(getStyles);

  const filteredLogs = useMemo(() => {
    if (!errorLogsOnly) {
      return logs;
    }
    return logs.filter((log) => {
      const level = log.labels?.level || log.labels?.detected_level;
      return level?.toLowerCase() === 'error';
    });
  }, [logs, errorLogsOnly]);

  const hasNoErrorLogs = errorLogsOnly && filteredLogs.length === 0 && logs.length > 0;

  return (
    <div>
      {hasNoErrorLogs ? (
        <Box padding={4} display="flex" alignItems="center" justifyContent="center" minHeight="200px">
          <Text variant="body" color="secondary">
            No error logs found. Disable the filter to see all logs.
          </Text>
        </Box>
      ) : (
        <div className={styles.timelineContainer}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => {
              const level = log.labels.detected_level;

              return (
                <div key={log.id} className={styles.timelineItem} data-testid={`event-log-${log.id}`}>
                  <div className={styles.time}>
                    {dateTimeFormat(log[LokiFieldNames.Time], {
                      defaultWithMS: true,
                    })}
                  </div>
                  <div
                    className={cx(styles.level, {
                      [styles.error]: level === 'error',
                      [styles.info]: level === 'info',
                      [styles.warning]: level === 'warn',
                    })}
                  >
                    {level.toUpperCase()}
                  </div>
                  <div className={styles.mainKey}>{log.labels[mainKey]}</div>
                  <LabelRenderer log={filteredLogs[index]} mainKey={mainKey} />
                </div>
              );
            })
          ) : (
            <Box padding={4} display="flex" alignItems="center" justifyContent="center" minHeight="200px">
              <Text variant="body" color="secondary">
                No logs available
              </Text>
            </Box>
          )}
        </div>
      )}
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
    return <Component log={log as unknown as HTTPResponseTimingsLog} />;
  }

  return <UniqueLogLabels log={log} />;
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    timelineContainer: css`
      position: relative;
      height: 100%;
      width: 100%;
      font-family: ${theme.typography.fontFamilyMonospace};
      overflow-x: auto;
    `,
    timelineItem: css`
      display: grid;
      grid-template-columns: 210px 65px 3fr minmax(300px, 2fr);
      align-items: center;
      gap: ${theme.spacing(2)};
      border-bottom: 1px solid ${theme.colors.border.medium};
      padding: ${theme.spacing(0.5)};
    `,
    mainKey: css`
      /* white-space: pre; // for scripted / browser checks?  */
      overflow-x: auto;
    `,
    time: css`
      color: ${theme.colors.text.secondary};
    `,
    level: css`
      color: ${theme.colors.text.secondary};
      font-family: ${theme.typography.fontFamilyMonospace};
    `,
    error: css`
      color: ${theme.colors.error.text};
    `,
    info: css`
      color: ${theme.colors.info.text};
    `,
    warning: css`
      color: ${theme.colors.warning.text};
    `,
  };
};
