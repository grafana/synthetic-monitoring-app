import { useEffect, useMemo, useRef, useState } from 'react';
import { joinRegexValues } from 'queries/queries.utils';

import {
  ExecutionLabels,
  ExecutionLabelType,
  FailedLogLabels,
  SucceededLogLabels,
} from 'features/parseCheckLogs/checkLogs.types';
import { Check } from 'types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

export interface ExecutionRecord {
  timestamp: number;
  probe: string;
  success: boolean;
  durationSeconds: number;
  job: string;
  instance: string;
}

export interface FolderExecutionLogs {
  timeRange: { from: number; to: number };
  executionsByCheck: Map<string, ExecutionRecord[]>;
  failures: ExecutionRecord[];
  isLoading: boolean;
  isError: boolean;
}

export function useFolderExecutionLogs(checks: Check[]): FolderExecutionLogs {
  // Rolling last-3h window, advanced on an interval so the swimlane stays a
  // live view. Each tick changes the query key, which refetches the window.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), STANDARD_REFRESH_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  const timeRange = useMemo(() => ({ from: now - THREE_HOURS_MS, to: now }), [now]);

  const expr = useMemo(() => {
    const jobs = joinRegexValues(checks.map((check) => check.job));
    const instances = joinRegexValues(checks.map((check) => check.target));
    return `{job=~"${jobs}", instance=~"${instances}"} | logfmt |="duration_seconds="`;
  }, [checks]);

  const {
    data: logs = [],
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteLogs<ExecutionLabels & (FailedLogLabels | SucceededLogLabels), ExecutionLabelType>({
    refId: 'folderExecutionLogs',
    expr,
    // NaN start disables the underlying query — an empty folder has nothing to fetch.
    start: checks.length > 0 ? timeRange.from : NaN,
    end: timeRange.to,
  });

  useEffect(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, logs.length]);

  const computed = useMemo(() => {
    const pairKeys = new Set(checks.map((check) => getCheckCompositeKey(check.job, check.target)));
    const executionsByCheck = new Map<string, ExecutionRecord[]>();
    const failures: ExecutionRecord[] = [];

    logs.forEach((log) => {
      const { job, instance, probe, probe_success, duration_seconds } = log.labels;
      const key = getCheckCompositeKey(job, instance);
      // The regex matcher can over-match a job+instance cross-product;
      // exact-match the pairs client-side.
      if (!pairKeys.has(key)) {
        return;
      }

      const record: ExecutionRecord = {
        timestamp: log.timestamp,
        probe,
        success: probe_success === '1',
        durationSeconds: Number(duration_seconds),
        job,
        instance,
      };

      const existing = executionsByCheck.get(key);
      if (existing) {
        existing.push(record);
      } else {
        executionsByCheck.set(key, [record]);
      }

      if (!record.success) {
        failures.push(record);
      }
    });

    failures.sort((a, b) => b.timestamp - a.timestamp);

    return { timeRange, executionsByCheck, failures, isLoading, isError };
  }, [logs, checks, timeRange, isLoading, isError]);

  // Advancing the window creates a fresh query (loading state) every tick;
  // keep showing the previous window while the next one fetches so the
  // swimlane doesn't flash a loader once a minute.
  const persisted = useRef<FolderExecutionLogs>(computed);
  if (!computed.isLoading || persisted.current.failures.length + persisted.current.executionsByCheck.size === 0) {
    persisted.current = computed;
  }

  return persisted.current;
}
