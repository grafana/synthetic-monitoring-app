import { useQuery } from '@tanstack/react-query';
import { parseLokiLogs } from 'features/parseLokiLogs/parseLokiLogs';
import { queryLoki } from 'features/queryDatasources/queryLoki';

import { useLogsDS } from 'hooks/useLogsDS';
import {
  FARO_APP_PLUGIN_ID,
  REF_ID_FARO_SESSION,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  buildFaroSessionByExecutionIdLogQL,
  buildFaroSessionHref,
  buildFaroSessionLogQL,
  getFaroSessionFromLogs,
} from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

export interface FaroSessionResult {
  appId: string;
  sessionId: string;
  href: string;
}

interface UseFaroSessionLinkProps {
  job: string;
  instance: string;
  probe?: string;
  // When present, correlation is pinned to this exact check run via
  // `k6_testRunId="sm:<executionId>"`. When absent (older agents), we fall back
  // to matching job/instance/probe inside the legacy k6_testRunId JSON blob.
  executionId?: string;
  from: number;
  to: number;
  enabled?: boolean;
}

export function useFaroSessionLink({
  job,
  instance,
  probe,
  executionId,
  from,
  to,
  enabled = true,
}: UseFaroSessionLinkProps) {
  const logsDS = useLogsDS();
  const hasExecutionId = Boolean(executionId);
  // The execution-id path is an exact match and does not need job/instance/probe.
  const canQuery = Boolean(
    logsDS && (hasExecutionId || (job && instance && probe)) && from && to && from < to && enabled
  );
  const expr = !canQuery
    ? ''
    : hasExecutionId
      ? buildFaroSessionByExecutionIdLogQL(executionId!)
      : buildFaroSessionLogQL({ job, instance, probe: probe! });

  return useQuery<FaroSessionResult | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-session', logsDS?.uid, expr, from, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
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
          return null;
        }

        return {
          appId: session.appId,
          sessionId: session.sessionId,
          href: buildFaroSessionHref({ pluginId: FARO_APP_PLUGIN_ID, ...session }),
        };
      } catch {
        // Fail silently - Faro/FE O11y may not be available in this stack.
        return null;
      }
    },
    enabled: canQuery,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}
