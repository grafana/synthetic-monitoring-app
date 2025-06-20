import React from 'react';
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

import { LokiFieldNames, UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

const logPanelOptions = {
  showTime: true,
  showLabels: false,
  showCommonLabels: false,
  wrapLogMessage: false,
  prettifyLogMessage: false,
  enableLogDetails: true,
  dedupStrategy: LogsDedupStrategy.none,
  sortOrder: LogsSortOrder.Ascending,
};

// todo: make this more fully featured, such as:
// having a search which either filters or highlights
// add option for wordwrap
// add label / level filters, etc.
export const LogsRaw = <T extends UnknownParsedLokiRecord>({ logs, mainKey }: { logs: T[]; mainKey: string }) => {
  return (
    <PanelRenderer
      title="Logs"
      pluginId="logs"
      width={innerWidth}
      height={innerHeight}
      data={getPanelData(logs)}
      options={{
        ...logPanelOptions,
        wrapLogMessage: true,
      }}
    />
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
