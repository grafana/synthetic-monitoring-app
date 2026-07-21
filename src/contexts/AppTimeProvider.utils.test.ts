import { dateTime } from '@grafana/data';

import { absoluteTimeRangeToRaw } from './AppTimeProvider.utils';

describe('absoluteTimeRangeToRaw', () => {
  it('converts epoch milliseconds to ISO strings', () => {
    const from = Date.parse('2020-01-01T00:00:00.000Z');
    const to = Date.parse('2020-01-02T00:00:00.000Z');

    expect(absoluteTimeRangeToRaw({ from, to })).toEqual({
      from: dateTime(from).toISOString(),
      to: dateTime(to).toISOString(),
    });
  });
});
