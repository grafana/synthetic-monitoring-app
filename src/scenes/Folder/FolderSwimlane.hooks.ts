import { useEffect, useMemo, useState } from 'react';

import { ExecutionLabels, ExecutionLabelType, FailedLogLabels, SucceededLogLabels } from 'features/parseCheckLogs/checkLogs.types';
import { Check } from 'types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';
import { useInfiniteLogs } from 'data/useInfiniteLogs';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

// Values are interpolated into a Loki stream selector regex, which is fully
// anchored. Each character needs up to two escaping layers, applied in a
// single pass so nothing is ever re-escaped: RE2 metacharacters so values
// match literally, then string-literal escaping (backslashes doubled, quotes
// escaped) because LogQL double-quoted strings reject unknown escape
// sequences like `\.`.
function escapeRe2(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|"]/g, (char) => {
    if (char === '"') {
      return '\\"';
    }
    if (char === '\\') {
      // regex layer: \\ — string layer doubles each backslash
      return '\\\\\\\\';
    }
    // regex layer: \<char> — string layer doubles the backslash
    return `\\\\${char}`;
  });
}

function joinRegex(values: string[]): string {
  return [...new Set(values)].map(escapeRe2).join('|');
}

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
}

export function useFolderExecutionLogs(checks: Check[]): FolderExecutionLogs {
  // Fixed window captured on mount so the infinite-query key stays stable.
  const [timeRange] = useState(() => ({ from: Date.now() - THREE_HOURS_MS, to: Date.now() }));

  const expr = useMemo(() => {
    const jobs = joinRegex(checks.map((check) => check.job));
    const instances = joinRegex(checks.map((check) => check.target));
    return `{job=~"${jobs}", instance=~"${instances}"} | logfmt |="duration_seconds="`;
  }, [checks]);

  const {
    data: logs = [],
    isLoading,
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

  return useMemo(() => {
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

    return { timeRange, executionsByCheck, failures, isLoading };
  }, [logs, checks, timeRange, isLoading]);
}
