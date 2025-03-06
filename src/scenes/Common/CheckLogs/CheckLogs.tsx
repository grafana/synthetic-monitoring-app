import React, { useEffect } from 'react';
import { TimeRange } from '@grafana/data';
import { groupLogs } from 'features/parseCheckLogs/groupLogs';
import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';

import { CheckLogsSeries } from 'features/parseCheckLogs/checkLogs.types';
import { ChecksByProbe } from 'scenes/Common/CheckLogs/ChecksByProbe';

export const CheckLogs = ({ series, timeRange }: { series: CheckLogsSeries; timeRange: TimeRange }) => {
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
