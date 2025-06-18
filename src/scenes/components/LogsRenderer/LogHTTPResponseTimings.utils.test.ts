import { getTiming } from 'scenes/components/LogsRenderer/LogHTTPResponseTimings.utils';

describe(`getTiming`, () => {
  it(`should return the correct timing with milliseconds and nanoseconds`, () => {
    const start = `2025-06-17 16:25:37.86273212 +0000 UTC`;
    const end = `2025-06-17 16:25:37.910564185 +0000 UTC`;
    expect(getTiming(start, end)).toBe(47.83203125);
  });
});
