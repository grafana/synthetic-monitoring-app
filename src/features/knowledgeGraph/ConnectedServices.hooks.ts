import { useQuery } from '@tanstack/react-query';
import { CoreApp, DataQueryRequest, DataQueryResponse, LoadingState, TimeRange } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { useTimeRange } from '@grafana/scenes-react';
import { DataQuery } from '@grafana/schema';
import { isObservable, lastValueFrom } from 'rxjs';

import { Check } from 'types';
import { useKGDS } from 'hooks/useKGDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { buildServiceNeighbourhoodQuery, parseGraphFrames, ServiceNeighbourhood } from './ConnectedServices.utils';
import { getSyntheticCheckEntityName } from './knowledgeGraph';

/** The KG datasource's entityGraph query in Cypher mode (see the KG plugin's kgdatasource types). */
interface KGEntityGraphQuery extends DataQuery {
  queryType: 'entityGraph';
  queryMode: 'cypher';
  cypherQuery: string;
}

async function fetchServiceNeighbourhood(
  datasourceUid: string,
  checkEntityName: string,
  range: TimeRange
): Promise<ServiceNeighbourhood> {
  const datasource = await getDataSourceSrv().get({ uid: datasourceUid });

  const query: KGEntityGraphQuery = {
    refId: 'A',
    queryType: 'entityGraph',
    queryMode: 'cypher',
    cypherQuery: buildServiceNeighbourhoodQuery(checkEntityName),
  };

  const request: DataQueryRequest = {
    requestId: 'sm-kg-service-neighbourhood',
    targets: [query],
    range,
    interval: '30s',
    intervalMs: 30_000,
    maxDataPoints: 100,
    scopedVars: {},
    timezone: 'browser',
    app: CoreApp.Unknown,
    startTime: Date.now(),
  };

  const result = datasource.query(request);
  const response: DataQueryResponse = isObservable(result) ? await lastValueFrom(result) : await result;

  if (response.state === LoadingState.Error || response.errors?.length) {
    throw new Error(response.errors?.[0]?.message ?? 'The Knowledge Graph query failed.');
  }

  return parseGraphFrames(response.data ?? []);
}

/**
 * Runs the check's service-neighbourhood Cypher query against the Knowledge Graph datasource
 * (directly via the datasource API — no scenes query runner) and returns the parsed graph.
 * The KG resolves entities against the dashboard's time range, so historic look-ups show the
 * neighbourhood as of that window. Disabled when the KG datasource isn't present on the stack.
 */
export function useServiceNeighbourhood(check: Check) {
  const kgDS = useKGDS();
  const checkEntityName = getSyntheticCheckEntityName(check);
  const [timeRange] = useTimeRange();

  return useQuery({
    queryKey: [
      'kg-service-neighbourhood',
      kgDS?.uid,
      checkEntityName,
      timeRange.from.valueOf(),
      timeRange.to.valueOf(),
    ],
    enabled: Boolean(kgDS),
    queryFn: () => fetchServiceNeighbourhood(kgDS!.uid, checkEntityName, timeRange),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
  });
}
