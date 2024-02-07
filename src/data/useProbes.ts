import { useContext } from 'react';
import { type QueryKey, useMutation, UseMutationResult, useSuspenseQuery } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { type MutationProps } from 'data/types';
import { type Probe } from 'types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import type {
  AddProbeResult,
  DeleteProbeResult,
  ResetProbeTokenResult,
  UpdateProbeResult,
} from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';
import { queryClient } from 'data/queryClient';

const queryKeys: Record<'list' | 'create' | 'update' | 'delete', () => QueryKey> = {
  list: () => ['probes'],
  create: () => [...queryKeys.list(), 'create-probe'],
  update: () => [...queryKeys.list(), 'update-probe'],
  delete: () => [...queryKeys.list(), 'delete-probe'],
};

export function useProbes() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useSuspenseQuery({
    queryKey: queryKeys.list(),
    queryFn: () => api.listProbes(),
  });
}

export function useProbe(id: number) {
  const props = useProbes();
  const probe = props.data?.find((probe) => probe.id === id);

  return {
    ...props,
    data: probe,
  };
}

export function useCreateProbe({ onError, onSuccess }: MutationProps<AddProbeResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.CREATE_PROBE;

  return useMutation<AddProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: async (probe: Probe) => {
      try {
        const res = await api.addProbe({
          ...probe,
          public: false,
        });

        return res;
      } catch (error) {
        throw handleAddProbeError(error);
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
      successAlert: (res: AddProbeResult) => `Created probe ${res.probe.name}`,
      errorAlert: (error: Error) => `Failed to create probe`,
    },
  });
}

function handleAddProbeError(error: unknown) {
  if (isFetchError(error)) {
    return new Error(error.data.err);
  }

  return error;
}

export function useUpdateProbe({ onError, onSuccess }: MutationProps<UpdateProbeResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.UPDATE_PROBE;

  return useMutation<UpdateProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) => api.updateProbe(probe),
    onError: (error: unknown) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
      onSuccess?.(data);
    },
    meta: {
      event,
      successAlert: (res: UpdateProbeResult) => `Updated probe ${res.probe.name}`,
      errorAlert: () => `Failed to update probe`,
    },
  });
}

type ExtendedDeleteProbeResult = DeleteProbeResult & {
  probeName: Probe['name'];
};

export function useDeleteProbe({ onError, onSuccess }: MutationProps<DeleteProbeResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.DELETE_PROBE;

  return useMutation<ExtendedDeleteProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) =>
      api.deleteProbe(probe.id!).then((res) => ({
        ...res,
        probeName: probe.name,
      })),
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
      onSuccess?.(data);
    },
    meta: {
      event,
      successAlert: (res: ExtendedDeleteProbeResult) => `Deleted probe ${res.probeName}`,
    },
  });
}

export function useResetProbeToken({ onError, onSuccess }: MutationProps<ResetProbeTokenResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.RESET_PROBE_TOKEN;

  return useMutation<ResetProbeTokenResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) => api.resetProbeToken(probe),
    onError: (error) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    meta: {
      event,
      errorAlert: () => `Failed to reset probe token`,
    },
  });
}
