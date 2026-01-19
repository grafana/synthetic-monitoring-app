import React, { useState } from 'react';
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

const LogsRawComponent = <T extends UnknownParsedLokiRecord>({ logs }: { logs: T[] }) => {
  const [width, setWidth] = useState(0);

  return (
    <div>
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
          data={getPanelData(logs)}
          options={{
            ...logPanelOptions,
            wrapLogMessage: true,
          }}
        />
      </div>
    </div>
  );
};

export const LogsRaw = React.memo(LogsRawComponent) as typeof LogsRawComponent;

const getPanelData = (logs: UnknownParsedLokiRecord[]): PanelData => {
  const firstLog = logs[0];
  const lastLog = logs[logs.length - 1];

  const from = firstLog[LokiFieldNames.TimeStamp];
  const to = lastLog[LokiFieldNames.TimeStamp];

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
        values: logs.map((log) => log[LokiFieldNames.TimeStamp]),
        nanos: logs.map((log) => log.nanos),
      },
      { name: 'log', type: FieldType.string, values: logs.map((log) => log[LokiFieldNames.Body]) },
      { name: 'labels', type: FieldType.other, values: logs.map((log) => log[LokiFieldNames.Labels]) },
    ],
  });
};

const createTimeRange = (from: DateTime | string, to: DateTime | string): TimeRange => ({
  from: dateTime(from),
  to: dateTime(to),
  raw: { from, to },
});
