import { useQuery } from '@tanstack/react-query';

import { Label } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';

export interface ExperimentalSecret {
  name: string;
  description: string;
  labels: Label[];
  uuid: string;
  org_id: number;
  stack_id: number;
  created_by: string;
  created_at: number;
  modified_at: number;
}

export interface ExperimentalSecretsResponse {
  secrets: ExperimentalSecret[];
}

export const queryKeys = {
  list: ['secrets'],
};

function secretsQuery(api: SMDataSource) {
  return {
    queryKey: queryKeys.list,
    queryFn: api.getSecrets,
    select: (data: ExperimentalSecretsResponse) => {
      return data?.secrets ?? [];
    },
  };
}

export function useSecrets() {
  const smDS = useSMDS();

  return useQuery<ExperimentalSecretsResponse, unknown, ExperimentalSecret[]>(secretsQuery(smDS));
}
