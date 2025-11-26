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
import { Box, InlineSwitch } from '@grafana/ui';

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

export const LogsRaw = <T extends UnknownParsedLokiRecord>({ logs }: { logs: T[] }) => {
  const [width, setWidth] = useState(0);
  const [errorOnly, setErrorOnly] = useState(false);

  const filteredLogs = useMemo(() => {
    if (!errorOnly) {
      return logs;
    }
    return logs.filter((log) => {
      const level = log.labels?.level || log.labels?.detected_level;
      return level?.toLowerCase() === 'error';
    });
  }, [logs, errorOnly]);

  return (
    <div>
      <Box paddingBottom={1} display="flex" justifyContent="flex-end">
        <InlineSwitch
          label="Error logs only"
          transparent
          showLabel
          value={errorOnly}
          onChange={() => setErrorOnly(!errorOnly)}
        />
      </Box>
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
      </div>
    </div>
  );
};

const getPanelData = (logs: UnknownParsedLokiRecord[]): PanelData => {
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
