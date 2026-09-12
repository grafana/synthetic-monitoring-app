import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { parseLokiLogs } from 'features/parseLokiLogs/parseLokiLogs';
import { queryLoki } from 'features/queryDatasources/queryLoki';

import { CheckType } from 'types';
import { useLogsDS } from 'hooks/useLogsDS';
import {
  FARO_APP_PLUGIN_ID,
  REF_ID_FARO_RUM_PROBE,
  REF_ID_FARO_SESSION,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { StatefulTimepoint, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  buildFaroSessionByExecutionIdLogQL,
  buildFaroSessionHref,
  buildFaroSessionProbeLogQL,
  collectExecutionIdsFromListLogsMap,
  getFaroSessionFromLogs,
  reduceRumAvailability,
  RumAvailability,
} from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

export interface FaroSessionResult {
  appId: string;
  sessionId: string;
  href: string;
}

interface UseFaroSessionLinkProps {
  executionId: string;
  from: number;
  to: number;
  enabled?: boolean;
  onSuccess?: (data: FaroSessionResult | null) => void;
}

export function useFaroSessionLink({
  executionId,
  from,
  to,
  enabled = true,
  onSuccess,
}: UseFaroSessionLinkProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && executionId && from && to && from < to && enabled);
  const expr = canQuery ? buildFaroSessionByExecutionIdLogQL(executionId) : '';
  // Keep the latest callback without putting it in the query key / queryFn deps.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  return useQuery<FaroSessionResult | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-session', logsDS?.uid, expr, from, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      const frames = await queryLoki<Record<string, string>, Record<string, string>>({
        datasource: logsDS,
        query: expr,
        start: from,
        end: to,
        refId: REF_ID_FARO_SESSION,
      });

      const parsed = frames[0] ? parseLokiLogs(frames[0]) : [];
      const session = getFaroSessionFromLogs(parsed);

      if (!session) {
        onSuccessRef.current?.(null);
        return null;
      }

      const result = {
        appId: session.appId,
        sessionId: session.sessionId,
        href: buildFaroSessionHref({ pluginId: FARO_APP_PLUGIN_ID, ...session }),
      };
      onSuccessRef.current?.(result);
      return result;
    },
    enabled: canQuery,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

interface UseCheckRumAvailabilityProps {
  checkType: CheckType;
  listLogsMap: Record<UnixTimestamp, StatefulTimepoint>;
  enabled?: boolean;
}

export function useCheckRumAvailability({
  checkType,
  listLogsMap,
  enabled = true,
}: UseCheckRumAvailabilityProps) {
  const logsDS = useLogsDS();
  const [rumAvailability, setRumAvailability] = useState<RumAvailability>('unknown');
  const isBrowserCheck = checkType === CheckType.Browser;

  const { executionIds, from, to } = useMemo(
    () => collectExecutionIdsFromListLogsMap(listLogsMap),
    [listLogsMap]
  );

  const canProbe = Boolean(
    enabled && isBrowserCheck && logsDS && executionIds.length > 0 && from && to && from < to
  );
  const expr = canProbe ? buildFaroSessionProbeLogQL(executionIds) : '';

  const probeQuery = useQuery<'present' | 'absent'>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-rum-probe', logsDS?.uid, expr, from, to],
    queryFn: async () => {
      if (!logsDS) {
        return 'absent';
      }

      const frames = await queryLoki<Record<string, string>, Record<string, string>>({
        datasource: logsDS,
        query: expr,
        start: from,
        end: to,
        refId: REF_ID_FARO_RUM_PROBE,
      });

      const parsed = frames[0] ? parseLokiLogs(frames[0]) : [];
      return parsed.length > 0 ? 'present' : 'absent';
    },
    enabled: canProbe,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });

  useEffect(() => {
    if (probeQuery.isError) {
      setRumAvailability((current) => reduceRumAvailability(current, { type: 'probe-error' }));
      return;
    }

    if (probeQuery.isSuccess && probeQuery.data) {
      setRumAvailability((current) =>
        reduceRumAvailability(current, { type: 'probe-result', result: probeQuery.data })
      );
    }
  }, [probeQuery.isError, probeQuery.isSuccess, probeQuery.data]);

  const markRumPresent = useCallback(() => {
    setRumAvailability((current) => reduceRumAvailability(current, { type: 'passive-success' }));
  }, []);

  return {
    rumAvailability,
    markRumPresent,
  };
}
