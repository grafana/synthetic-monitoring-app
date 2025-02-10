import { useQuery } from '@tanstack/react-query';

import { useSMDS } from './useSMDS';

export function useSecrets() {
  const datasource = useSMDS();

  return useQuery({
    queryKey: ['secrets'],
    queryFn: async () => {
      return await datasource.fetchSecrets();
    },
  });
}
