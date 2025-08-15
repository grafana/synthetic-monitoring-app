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
import { Link } from '@grafana/ui';

import { LokiFieldNames, UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { getExploreUrl } from 'data/utils';
import { useLogsDS } from 'hooks/useLogsDS';

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

// todo: make this more fully featured, such as:
// having a search which either filters or highlights
// add option for wordwrap
// add label / level filters, etc.
export const LogsRaw = <T extends UnknownParsedLokiRecord>({
  logs,
  mainKey,
  startTime,
  endTime,
  check,
}: {
  logs: T[];
  mainKey: string;
  startTime: number;
  endTime: number;
  check: Check;
}) => {
  const [width, setWidth] = useState(0);
  const logsDS = useLogsDS();
  const probe = logs[0][LokiFieldNames.Labels].probe;
  const query = `{job="${check.job}", instance="${check.target}", probe="${probe}"} | logfmt`;
  const exploreURL = getExploreUrl(logsDS?.uid!, [query], {
    from: dateTime(startTime),
    to: dateTime(endTime),
    raw: { from: String(startTime), to: String(endTime) },
  });

  return (
    <div>
      <Link href={exploreURL} target="_blank">
        Explore link
      </Link>
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
