import { type QueryKey, useQuery } from '@tanstack/react-query';

import { SMDataSource } from 'datasource/DataSource';
import type { InsightsResponse } from 'datasource/responses.types';
import { useSMDS } from 'hooks/useSMDS';

export const INSIGHTS_QUERY_KEYS: Record<'insights', QueryKey> = {
  insights: ['insights'],
};

const insightsQuery = (api: SMDataSource) => ({
  queryKey: INSIGHTS_QUERY_KEYS.insights,
  queryFn: (): Promise<InsightsResponse> => api.getInsights(),
});

export function useInsights() {
  const smDS = useSMDS();
  return useQuery(insightsQuery(smDS));
}
