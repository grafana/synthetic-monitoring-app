import { useMutation } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';
import { emitCheckCreatedEvent } from 'features/tracking/appEvents';
import { trackCheckCreated } from 'features/tracking/checkFormEvents';

import { Check } from 'types';
import { FaroEvent } from 'faro';
import { getCheckType } from 'utils';
import { AddCheckResult } from 'datasource/responses.types';
import { useSMDS } from 'hooks/useSMDS';

import { getAvailableCheckName } from './checkNames';

export function useCreateTemplateCheck() {
  const smDS = useSMDS();

  return useMutation<AddCheckResult, Error, Check>({
    mutationFn: async (check) => {
      try {
        const conflictingNames = new Set<string>();
        for (let attempt = 0; ; attempt++) {
          const checks = await smDS.listChecks();
          const job = getAvailableCheckName(check, checks, conflictingNames);
          try {
            // The mutation reports final failures. Keep recoverable conflicts quiet.
            return await smDS.addCheck({ ...check, job }, { showErrorAlert: false });
          } catch (error) {
            const message = isFetchError(error) ? error.data.err : error instanceof Error ? error.message : undefined;
            if (attempt >= 2 || !message?.includes('target/job combination already exists')) {
              throw error;
            }
            // The list can lag behind a concurrent creation. Do not reuse a name
            // that the API has already rejected during this submission.
            conflictingNames.add(job);
          }
        }
      } catch (error) {
        throw isFetchError(error) ? new Error(error.data.err) : error;
      }
    },
    onSuccess: (data) => {
      const checkType = getCheckType(data.settings);
      trackCheckCreated({ checkType });
      emitCheckCreatedEvent({ checkType });
    },
    meta: {
      event: { type: FaroEvent.CreateCheck },
      successAlert: (res: AddCheckResult) => `Created check ${res.job}`,
      errorAlert: () => 'Failed to create check',
    },
  });
}
