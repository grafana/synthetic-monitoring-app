import { dateTime, LoadingState, PanelData, TimeRange } from '@grafana/data';

import { cloneFrame } from './frameUtils';
import { QueryExecutionResult } from './types';

const EMPTY_TIME_RANGE: TimeRange = {
  from: dateTime(),
  to: dateTime(),
  raw: {
    from: 'now-1h',
    to: 'now',
  },
};

export function toPanelData(results: QueryExecutionResult[], timeRange: TimeRange = EMPTY_TIME_RANGE): PanelData {
  const frames = results.flatMap((result) => result.frames.map(cloneFrame));
  const errors = results.flatMap((result) =>
    (result.errors ?? []).map((error) => ({
      message: error.message,
    }))
  );
  const fatalErrors = results.map((result) => result.fatalError).filter(Boolean) as string[];

  if (frames.length === 0 && fatalErrors.length > 0) {
    return {
      state: LoadingState.Error,
      series: [],
      error: new Error(fatalErrors[0]),
      timeRange,
    };
  }

  if (errors.length > 0) {
    return {
      state: LoadingState.Done,
      series: frames,
      errors,
      timeRange,
    };
  }

  return {
    state: frames.length > 0 ? LoadingState.Done : LoadingState.Loading,
    series: frames,
    timeRange,
  };
}
