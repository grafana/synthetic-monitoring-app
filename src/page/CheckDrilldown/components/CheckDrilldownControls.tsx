import React from 'react';
import { dateTime } from '@grafana/data';
import { RefreshPicker, Stack, TimeRangePicker } from '@grafana/ui';

import { useTimeRange } from 'page/CheckDrilldown/components/TimeRangeContext';

export const CheckDrilldownControls = () => {
  const { timeRange, setTimeRange, refreshInterval, setRefreshInterval } = useTimeRange();

  return (
    <div>
      <Stack justifyContent={`flex-end`}>
        <TimeRangePicker
          isOnCanvas
          value={timeRange}
          onChange={(t) => {
            console.log(t);
            setTimeRange(t);
          }}
          onChangeTimeZone={(t) => console.log(t)}
          onMoveBackward={() =>
            setTimeRange({
              from: dateTime(timeRange.from).subtract(1, 'day'),
              to: dateTime(timeRange.to).subtract(1, 'day'),
              raw: {
                from: timeRange.from.subtract(1, 'day'),
                to: timeRange.from.subtract(1, 'day'),
              },
            })
          }
          onMoveForward={() =>
            setTimeRange({
              from: dateTime(timeRange.from).add(1, 'day'),
              to: dateTime(timeRange.to).add(1, 'day'),
              raw: {
                from: timeRange.from.add(1, 'day'),
                to: timeRange.from.add(1, 'day'),
              },
            })
          }
          onZoom={() =>
            setTimeRange({
              from: dateTime(timeRange.from).add(1, 'day'),
              to: dateTime(timeRange.to).add(1, 'day'),
              raw: {
                from: timeRange.from.add(1, 'day'),
                to: timeRange.from.add(1, 'day'),
              },
            })
          }
        />
        <RefreshPicker
          // onRefresh={() => {
          //   console.log('refresh');
          // }}
          onIntervalChanged={setRefreshInterval}
          isOnCanvas
          value={refreshInterval}
          text="Refresh"
        />
      </Stack>
    </div>
  );
};
