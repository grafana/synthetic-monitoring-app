import { renderHook, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';

import { Result } from 'test/handlers/types';

import {
  parseGoDuration,
  parseMaxQueryLookback,
  REF_ID_LOGS_RETENTION_CANARY,
  useLogsRetentionPeriod,
} from './useLogsRetention';

const MILLISECONDS_IN_HOUR = 60 * 60 * 1000;
const STANDARD_RETENTION_PERIOD = 31 * 24 * MILLISECONDS_IN_HOUR;
const NINETY_DAYS_IN_HOURS = 2160;

const MAX_QUERY_LOOKBACK_ERROR_MESSAGE = `this data is no longer available, it is past now - max_query_lookback (${NINETY_DAYS_IN_HOURS}h0m0s)`;

function mockCanaryQuery(result: Result<unknown>) {
  server.use(
    apiRoute(`getHttpDashboard`, {
      result: () => result,
    })
  );
}

describe(`useLogsRetentionPeriod`, () => {
  it(`returns the retention period parsed from Loki's max_query_lookback error`, async () => {
    mockCanaryQuery({
      status: 400,
      json: {
        results: {
          [REF_ID_LOGS_RETENTION_CANARY]: {
            error: MAX_QUERY_LOOKBACK_ERROR_MESSAGE,
            status: 400,
          },
        },
      },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogsRetentionPeriod(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.retentionPeriod).toBe(NINETY_DAYS_IN_HOURS * MILLISECONDS_IN_HOUR);
  });

  it(`returns null when no lookback limit is enforced (query succeeds)`, async () => {
    mockCanaryQuery({
      json: {
        results: {
          [REF_ID_LOGS_RETENTION_CANARY]: {
            frames: [],
          },
        },
      },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogsRetentionPeriod(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.retentionPeriod).toBe(null);
  });

  it(`falls back to the standard retention period when the canary query fails unexpectedly`, async () => {
    mockCanaryQuery({
      status: 500,
      json: {
        message: `something went wrong`,
      },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useLogsRetentionPeriod(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.retentionPeriod).toBe(STANDARD_RETENTION_PERIOD);
  });
});

describe(`parseMaxQueryLookback`, () => {
  it(`extracts the duration from the error message`, () => {
    expect(parseMaxQueryLookback(MAX_QUERY_LOOKBACK_ERROR_MESSAGE)).toBe(NINETY_DAYS_IN_HOURS * MILLISECONDS_IN_HOUR);
  });

  it(`returns null when the message doesn't contain a lookback limit`, () => {
    expect(parseMaxQueryLookback(`some other error`)).toBe(null);
  });

  it(`returns null when the duration can't be parsed`, () => {
    expect(parseMaxQueryLookback(`it is past now - max_query_lookback (not a duration)`)).toBe(null);
  });
});

describe(`parseGoDuration`, () => {
  it.each([
    [`2160h`, 2160 * MILLISECONDS_IN_HOUR],
    [`744h0m0s`, 744 * MILLISECONDS_IN_HOUR],
    [`1.5h`, 1.5 * MILLISECONDS_IN_HOUR],
    [`30m`, 30 * 60 * 1000],
    [`90s`, 90 * 1000],
    [`500ms`, 500],
    [`1h30m`, 1.5 * MILLISECONDS_IN_HOUR],
  ])(`parses %s`, (duration, expected) => {
    expect(parseGoDuration(duration)).toBe(expected);
  });

  it(`returns null for unparseable input`, () => {
    expect(parseGoDuration(`nonsense`)).toBe(null);
  });
});
