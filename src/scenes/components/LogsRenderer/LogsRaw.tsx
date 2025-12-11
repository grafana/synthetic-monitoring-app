import React, { useMemo, useState } from 'react';
import {
  createDataFrame,
  DataFrame,
  DateTime,
  dateTime,
  FieldType,
  LoadingState,
  PanelData,
  TimeRange,
} from '@grafana/data';
import { PanelRenderer } from '@grafana/runtime';
import { LogsDedupStrategy, LogsSortOrder } from '@grafana/schema';
import { Box, Text } from '@grafana/ui';

import { LokiFieldNames, UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

const logPanelOptions = {
  showTime: true,
  showLabels: true,
  showCommonLabels: false,
  wrapLogMessage: false,
  prettifyLogMessage: false,
  enableLogDetails: true,
  dedupStrategy: LogsDedupStrategy.none,
  sortOrder: LogsSortOrder.Ascending,
};

const LOGS_HEIGHT = 400;

export const LogsRaw = <T extends UnknownParsedLokiRecord>({
  logs,
  errorLogsOnly,
  onErrorLogsOnlyChange,
}: {
  logs: T[];
  errorLogsOnly: boolean;
  onErrorLogsOnlyChange: (value: boolean) => void;
}) => {
  const [width, setWidth] = useState(0);

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
        <Box padding={4} display="flex" alignItems="center" justifyContent="center" minHeight={`${LOGS_HEIGHT}px`}>
          <Text variant="body" color="secondary">
            No error logs found. Disable the filter to see all logs.
          </Text>
        </Box>
      ) : (
        <div
          ref={(el) => {
            if (el) {
              setWidth(el.clientWidth);
            }
          }}
          style={{
            height: `${LOGS_HEIGHT}px`,
          }}
        >
          {filteredLogs.length > 0 ? (
            <PanelRenderer
              title="Logs"
              pluginId="logs"
              width={width}
              height={LOGS_HEIGHT}
              data={getPanelData(filteredLogs)}
              options={{
                ...logPanelOptions,
                wrapLogMessage: true,
              }}
            />
          ) : (
            <Box padding={4} display="flex" alignItems="center" justifyContent="center" height={`${LOGS_HEIGHT}px`}>
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

const getPanelData = (logs: UnknownParsedLokiRecord[]): PanelData => {
  if (logs.length === 0) {
    const now = dateTime();
    return {
      state: LoadingState.Done,
      series: [createLogsDataFrame(logs)],
      timeRange: createTimeRange(now, now),
    };
  }

  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];

  const from = firstLog[LokiFieldNames.Time];
  const to = lastLog[LokiFieldNames.Time];

  return {
    state: LoadingState.Done,
    series: [createLogsDataFrame(logs)],
    timeRange: createTimeRange(String(from), String(to)),
  };
};

const createLogsDataFrame = (logs: UnknownParsedLokiRecord[]): DataFrame => {
  return createDataFrame({
    fields: [
      {
        name: 'time',
        type: FieldType.time,
        values: logs.map((log) => log[LokiFieldNames.Time]),
        nanos: logs.map((log) => log[LokiFieldNames.TsNs]),
      },
      { name: 'log', type: FieldType.string, values: logs.map((log) => log[LokiFieldNames.Line]) },
      { name: 'labels', type: FieldType.other, values: logs.map((log) => log[LokiFieldNames.Labels]) },
    ],
  });
};

const createTimeRange = (from: DateTime | string, to: DateTime | string): TimeRange => ({
  from: dateTime(from),
  to: dateTime(to),
  raw: { from, to },
});
