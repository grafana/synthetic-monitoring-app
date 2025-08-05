import { useQuery } from '@tanstack/react-query';

import { UseLogsQueryArgs } from '../CheckSidePanel.types';

import { useSMDS } from '../../../hooks/useSMDS';
import { loggify } from '../CheckSidePanel.utils';

export function useAdHocLogs(
  expr?: UseLogsQueryArgs['expr'],
  from: UseLogsQueryArgs['from'] = 'now-5m',
  to?: UseLogsQueryArgs['to'],
  poll = true
) {
  const dataSource = useSMDS();

  return useQuery({
    queryKey: ['logs', 'ad-hoc', { expr, from, to }],
    queryFn: async () => {
      return loggify(await dataSource.queryLogsV2(expr!, from, to));
    },
    enabled: !!expr,
    refetchInterval: poll ? 3000 : 0,
  });
}
