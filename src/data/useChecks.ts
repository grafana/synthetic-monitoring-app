import { type QueryKey, useMutation, UseMutationResult, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { type MutationProps } from 'data/types';
import { type Check, FeatureName } from 'types';
import { FaroEvent, FaroEventMeta } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import type {
  AddCheckResult,
  AdHocCheckResponse,
  BulkUpdateCheckResult,
  DeleteCheckResult,
  UpdateCheckResult,
} from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['checks'],
};

const checksQuery = (api: SMDataSource, includeAlerts = false) => {
  return {
    queryKey: [...queryKeys.list, { includeAlerts }],
    queryFn: () => api.listChecks(includeAlerts),
  };
};

export function useChecks() {
  const smDS = useSMDS();
  const perCheckAlertsFF = useFeatureFlag(FeatureName.AlertsPerCheck);
  return useQuery(checksQuery(smDS, perCheckAlertsFF.isEnabled));
}

export function useSuspenseChecks() {
  const smDS = useSMDS();
  const perCheckAlertsFF = useFeatureFlag(FeatureName.AlertsPerCheck);
  return useSuspenseQuery(checksQuery(smDS, perCheckAlertsFF.isEnabled));
}

export function useCheck(id: number) {
  const props = useChecks();
  const check = props.data?.find((check) => check.id === id);

  return {
    ...props,
    data: check,
  };
}

export function useCreateCheck({ eventInfo, onError, onSuccess }: MutationProps<AddCheckResult> = {}) {
  const smDS = useSMDS();
  const eventType = FaroEvent.CREATE_CHECK;

  return useMutation<AddCheckResult, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await smDS.addCheck(check);

        return res;
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: AddCheckResult) => `Created check ${res.job}`,
      errorAlert: (error: Error) => `Failed to create check`,
    },
  });
}

export function useUpdateCheck({ eventInfo, onError, onSuccess }: MutationProps<UpdateCheckResult> = {}) {
  const smDS = useSMDS();
  const eventType = FaroEvent.UPDATE_CHECK;

  return useMutation<UpdateCheckResult, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await smDS.updateCheck(check).then((res) => ({
          ...res,
          job: check.job,
        }));

        return res;
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error: unknown) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: UpdateCheckResult) => `Updated check ${res.job}`,
      errorAlert: () => `Failed to update check`,
    },
  });
}

type ExtendedDeleteCheckResult = DeleteCheckResult & {
  job: Check['job'];
};

export function useDeleteCheck({ eventInfo, onError, onSuccess }: MutationProps<DeleteCheckResult> = {}) {
  const smDS = useSMDS();
  const eventType = FaroEvent.DELETE_CHECK;

  return useMutation<ExtendedDeleteCheckResult, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await smDS.deleteCheck(check.id!).then((res) => ({
          ...res,
          job: check.job,
        }));

        return res;
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: ExtendedDeleteCheckResult) => `Deleted check ${res.job}`,
    },
  });
}

export type ExtendedBulkUpdateCheckResult = BulkUpdateCheckResult & {
  checks: Check[];
};

export function useBulkUpdateChecks({
  eventInfo,
  onError,
  onSuccess,
}: MutationProps<ExtendedBulkUpdateCheckResult> = {}) {
  const smDS = useSMDS();
  const eventType = FaroEvent.BULK_UPDATE_CHECK;

  return useMutation<ExtendedBulkUpdateCheckResult, Error, Check[], UseMutationResult>({
    mutationFn: async (checks: Check[]) => {
      try {
        const res = await smDS.bulkUpdateChecks(checks).then((result) => ({
          ...result,
          checks,
        }));
        return res;
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error: unknown) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: ExtendedBulkUpdateCheckResult) => `Updated ${res.checks.length} checks.`,
      errorAlert: () => `Failed to update check`,
    },
  });
}

export function useBulkDeleteChecks({ eventInfo, onSuccess, onError }: MutationProps<number[]> = {}) {
  const smDS = useSMDS();
  const eventType = FaroEvent.BULK_DELETE_CHECK;

  return useMutation<number[], Error, number[], UseMutationResult>({
    mutationFn: async (checkIds: number[]) => {
      const attempts = checkIds.map((id) => smDS.deleteCheck(id));
      const results = await Promise.allSettled(attempts);
      const errorCount = results.filter((r) => r.status === `rejected`).length;

      if (errorCount > 0) {
        throw new Error(String(errorCount));
      }

      return checkIds;
    },
    onError: (error: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: number[]) => `Deleted ${res.length} checks.`,
      errorAlert: (errorCount: unknown) => `Failed to delete ${errorCount} check${errorCount === 1 ? `` : `s`}.`,
    },
  });
}

export function useTestCheck({ eventInfo, onSuccess, onError }: MutationProps<AdHocCheckResponse> = {}) {
  const smDS = useSMDS();
  const eventType = FaroEvent.TEST_CHECK;

  return useMutation<AdHocCheckResponse, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await smDS
          .testCheck(check)
          .then((res) => {
            if (!res) {
              throw new Error(`No response`);
            }

            return res;
          })
          .then((res) => ({
            ...res,
            job: check.job,
          }));

        return res;
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error: unknown) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: AdHocCheckResponse) => `Testing check ${res.id}`,
      errorAlert: () => `Failed to test check`,
    },
  });
}

export function useCUDChecks({ eventInfo }: { eventInfo?: FaroEventMeta['info'] } = {}) {
  const { mutate: updateCheck, error: updateError, isPending: updatePending } = useUpdateCheck({ eventInfo });
  const { mutate: createCheck, error: createError, isPending: createPending } = useCreateCheck({ eventInfo });
  const { mutate: deleteCheck, error: deleteError, isPending: deletePending } = useDeleteCheck({ eventInfo });

  const error = updateError || createError || deleteError;
  const submitting = updatePending || createPending || deletePending;

  return {
    updateCheck,
    createCheck,
    deleteCheck,
    error,
    submitting,
  };
}

function handleError(error: unknown) {
  if (isFetchError(error)) {
    return new Error(error.data.err);
  }

  return error;
}
