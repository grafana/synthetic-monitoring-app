import { useContext } from 'react';
import { type QueryKey, useMutation, UseMutationResult, useSuspenseQuery } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { type MutationProps } from 'data/types';
import { type Check } from 'types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import type { AddCheckResult, DeleteCheckResult, UpdateCheckResult } from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';
import { queryClient } from 'data/queryClient';

const queryKeys: Record<'list' | 'create' | 'update' | 'delete', () => QueryKey> = {
  list: () => ['checks'],
  create: () => [...queryKeys.list(), 'create-check'],
  update: () => [...queryKeys.list(), 'update-check'],
  delete: () => [...queryKeys.list(), 'delete-check'],
};

export function useChecks() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useSuspenseQuery({
    queryKey: queryKeys.list(),
    queryFn: () => api.listChecks(),
  });
}

export function useCheck(id: number) {
  const props = useChecks();
  const check = props.data?.find((check) => check.id === id);

  return {
    ...props,
    data: check,
  };
}

export function useCreateCheck({ onError, onSuccess }: MutationProps<AddCheckResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.CREATE_CHECK;

  return useMutation<AddCheckResult, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await api.addCheck(check);

        return res;
      } catch (error) {
        throw handleError(error);
      }
    },
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
      onSuccess?.(data);
    },
    meta: {
      event,
      successAlert: (res: AddCheckResult) => `Created check ${res.job}`,
      errorAlert: (error: Error) => `Failed to create check`,
    },
  });
}

export function useUpdateCheck({ onError, onSuccess }: MutationProps<UpdateCheckResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.UPDATE_CHECK;

  return useMutation<UpdateCheckResult, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await api.updateCheck(check).then((res) => ({
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
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
      onSuccess?.(data);
    },
    meta: {
      event,
      successAlert: (res: UpdateCheckResult) => `Updated check ${res.job}`,
      errorAlert: () => `Failed to update check`,
    },
  });
}

type ExtendedDeleteCheckResult = DeleteCheckResult & {
  job: Check['job'];
};

export function useDeleteCheck({ onError, onSuccess }: MutationProps<DeleteCheckResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.DELETE_CHECK;

  return useMutation<ExtendedDeleteCheckResult, Error, Check, UseMutationResult>({
    mutationFn: async (check: Check) => {
      try {
        const res = await api.deleteCheck(check.id!).then((res) => ({
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
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
      onSuccess?.(data);
    },
    meta: {
      event,
      successAlert: (res: ExtendedDeleteCheckResult) => `Deleted check ${res.job}`,
    },
  });
}

function handleError(error: unknown) {
  if (isFetchError(error)) {
    return new Error(error.data.err);
  }

  return error;
}
