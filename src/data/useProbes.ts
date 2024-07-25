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
import { queryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['probes'],
};

function probesQuery(smDS: SMDataSource) {
  return {
    queryKey: queryKeys.list,
    queryFn: () => smDS.listProbes(),
  };
}

export function useProbes() {
  const smDS = useSMDS();

  return useQuery(probesQuery(smDS));
}

export function useSuspenseProbes() {
  const smDS = useSMDS();

  return useSuspenseQuery(probesQuery(smDS));
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
  const smDS = useSMDS();
  const eventType = FaroEvent.CREATE_PROBE;

  return useMutation<AddProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: async (probe: Probe) => {
      try {
        const res = await smDS.addProbe({
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
  const smDS = useSMDS();
  const eventType = FaroEvent.UPDATE_PROBE;

  return useMutation<UpdateProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) => smDS.updateProbe(probe),
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
  const smDS = useSMDS();
  const eventType = FaroEvent.DELETE_PROBE;

  return useMutation<ExtendedDeleteProbeResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) =>
      smDS.deleteProbe(probe.id!).then((res) => ({
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
  const smDS = useSMDS();
  const eventType = FaroEvent.RESET_PROBE_TOKEN;

  return useMutation<ResetProbeTokenResult, Error, Probe, UseMutationResult>({
    mutationFn: (probe: Probe) => smDS.resetProbeToken(probe),
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
