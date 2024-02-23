import { useContext } from 'react';
import { type QueryKey, useMutation, UseMutationResult, useQuery, useSuspenseQuery } from '@tanstack/react-query';
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

export const queryKeys: Record<'list', QueryKey> = {
  list: ['probes'],
};

function probesQuery(api: SMDataSource) {
  return {
    queryKey: queryKeys.list,
    queryFn: () => api.listProbes(),
  };
}

export function useProbes() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useQuery(probesQuery(api));
}

export function useSuspenseProbes() {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;

  return useSuspenseQuery(probesQuery(api));
}

export function useSuspenseProbe(id: number) {
  const props = useSuspenseProbes();
  const probe = props.data?.find((probe) => probe.id === id);

  return {
    ...props,
    data: probe,
  };
}

export function useCreateProbe({ eventInfo, onError, onSuccess }: MutationProps<AddProbeResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const eventType = FaroEvent.CREATE_PROBE;

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
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
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

export function useUpdateProbe({ eventInfo, onError, onSuccess }: MutationProps<UpdateProbeResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const eventType = FaroEvent.UPDATE_PROBE;

  return useMutation<UpdateProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) => api.updateProbe(probe),
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
      successAlert: (res: UpdateProbeResult) => `Updated probe ${res.probe.name}`,
      errorAlert: () => `Failed to update probe`,
    },
  });
}

type ExtendedDeleteProbeResult = DeleteProbeResult & {
  probeName: Probe['name'];
};

export function useDeleteProbe({ eventInfo, onError, onSuccess }: MutationProps<DeleteProbeResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const eventType = FaroEvent.DELETE_PROBE;

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
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
      successAlert: (res: ExtendedDeleteProbeResult) => `Deleted probe ${res.probeName}`,
    },
  });
}

export function useResetProbeToken({ eventInfo, onError, onSuccess }: MutationProps<ResetProbeTokenResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const eventType = FaroEvent.RESET_PROBE_TOKEN;

  return useMutation<ResetProbeTokenResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) => api.resetProbeToken(probe),
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
      errorAlert: () => `Failed to reset probe token`,
    },
  });
}
