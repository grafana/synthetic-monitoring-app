import React from 'react';
import { dateTime } from '@grafana/data';
import type { TimeZone } from '@grafana/schema';
import { fireEvent, render, screen } from '@testing-library/react';

import { SceneTimeRangePicker } from './SceneTimeRangePicker';

const onTimeRangeChange = jest.fn();
const onTimeZoneChange = jest.fn();
const getTimeZone = jest.fn<TimeZone, []>(() => 'browser');
const value = {
  from: dateTime('2026-09-27T10:00:00Z'),
  to: dateTime('2026-09-27T11:00:00Z'),
  raw: { from: 'now-1h', to: 'now' },
};

jest.mock('@grafana/scenes-react', () => ({
  useTimeRange: () => [value, { getTimeZone, onTimeRangeChange, onTimeZoneChange }],
}));

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  TimeRangePicker: ({ timeZone, onChangeTimeZone }: { timeZone: TimeZone; onChangeTimeZone: (tz: TimeZone) => void }) => (
    <button type="button" onClick={() => onChangeTimeZone('America/New_York')}>
      {timeZone}
    </button>
  ),
}));

describe('SceneTimeRangePicker', () => {
  it('persists time zone overrides in the scene time range', () => {
    render(<SceneTimeRangePicker />);

    fireEvent.click(screen.getByRole('button', { name: 'browser' }));

    expect(onTimeZoneChange).toHaveBeenCalledWith('America/New_York');
  });
});
