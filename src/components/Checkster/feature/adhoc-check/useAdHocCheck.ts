import { useMutation, UseMutationResult } from '@tanstack/react-query';

import type { Check } from 'types';
import { FaroEvent } from 'faro';
import type { AdHocCheckResponse } from 'datasource/responses.types';
import { useSMDS } from 'hooks/useSMDS';

export function useAdHocCheck() {
  const dataSource = useSMDS();
  return useMutation<AdHocCheckResponse, Error, Check, UseMutationResult>({
    mutationFn: async ({ id, ...check }) => {
      const data = await dataSource.testCheck(check);
      if (!data) {
        throw new Error(
          'AdHocCheckError: Sever returned an empty response. Most likely due to malformed check settings.'
        );
      }

      return data;
    },
    meta: {
      eventType: FaroEvent.TEST_CHECK,
    },
    scope: {
      id: 'run-ad-hoc-check',
    },
  });
}
