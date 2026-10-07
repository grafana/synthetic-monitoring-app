import React from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { TimeRangePicker } from '@grafana/ui';

export const SceneTimeRangePicker = () => {
  const [value, sceneTimeRange] = useTimeRange();

  return (
    <TimeRangePicker
      isOnCanvas
      value={value}
      timeZone={sceneTimeRange.getTimeZone()}
      onChange={sceneTimeRange.onTimeRangeChange}
      onChangeTimeZone={sceneTimeRange.onTimeZoneChange}
      onMoveBackward={() => {}}
      onMoveForward={() => {}}
      onZoom={() => {}}
    />
  );
};
