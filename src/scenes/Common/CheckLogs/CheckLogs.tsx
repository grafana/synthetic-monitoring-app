import React, { useEffect } from 'react';
import { TimeRange } from '@grafana/data';
import { groupLogs } from 'features/logParsing/groupLogs';
import { parseLokiLogs } from 'features/logParsing/parseLokiLogs';

import { LokiSeries } from 'features/logParsing/logs.types';
import { ChecksByProbe } from 'scenes/Common/CheckLogs/ChecksByProbe';

export const CheckLogs = ({ series, timeRange }: { series: LokiSeries; timeRange: TimeRange }) => {
  const orderedLogs = parseLokiLogs(series);
  const groupedLogsByProbe = groupLogs(orderedLogs);

  useEffect(() => {
    console.log(
      groupedLogsByProbe.map(({ probe, checks }) => ({
        probe,
        checks: checks.map((check) =>
          check.map(({ time, nanotime, value }) => {
            return {
              time: new Date(Number(String(time).slice(0, 13))),
              nanotime,
              ...value,
            };
          })
        ),
      }))
    );
  }, [groupedLogsByProbe]);

  return (
    <div>
      {groupedLogsByProbe.map(({ probe, checks }) => (
        <ChecksByProbe key={probe} probe={probe} checks={checks} timeRange={timeRange} />
      ))}
    </div>
  );
};
