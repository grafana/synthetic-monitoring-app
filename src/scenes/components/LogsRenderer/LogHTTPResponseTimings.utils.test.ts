import { constructGoTimestamp } from 'test/utils';

import { getTiming } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings.utils';

describe(`getTiming`, () => {
  it(`should return the correct timing with milliseconds and nanoseconds`, () => {
    const START = new Date().getTime();
    const END = START;
    const NANOSECONDS = 4783203125;

    const start = constructGoTimestamp(START);
    const end = constructGoTimestamp(END, NANOSECONDS);

    expect(getTiming(start, end)).toBe(NANOSECONDS / 100000000);
  });
});
