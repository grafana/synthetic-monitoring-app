import { useMemo } from 'react';
import { type QueryKey, useMutation, UseMutationResult, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { isFetchError } from '@grafana/runtime';

import { type MutationProps } from 'data/types';
import { ExtendedProbe, type Probe, ProbeWithMetadata } from 'types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import type {
  AddProbeResult,
  DeleteProbeError,
  DeleteProbeResult,
  ResetProbeTokenResult,
  UpdateProbeResult,
} from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';
import { useSMDS } from 'hooks/useSMDS';
import { EMPTY_METADATA, PROBES_METADATA } from 'components/CheckEditor/ProbesMetadata';

import { useChecks } from './useChecks';

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

export function useProbesWithMetadata() {
  const { data: probes = [], isLoading } = useProbes();

  const probesWithMetadata = useMemo<ProbeWithMetadata[]>(() => {
    if (isLoading) {
      return [];
    }

    return probes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((probe) => {
        const metadata =
          PROBES_METADATA.find((info) => info.name === probe.name && info.region === probe.region) || EMPTY_METADATA;

        return {
          ...metadata,
          ...probe,
          displayName: metadata.displayName || probe.name,
        };
      });
  }, [probes, isLoading]);

  return { data: probesWithMetadata, isLoading };
}

export function useExtendedProbes(): [ExtendedProbe[], boolean] {
  const { data: probes = [], isLoading: isLoadingProbes } = useProbesWithMetadata();
  const { data: checks = [], isLoading: isLoadingChecks } = useChecks();
  const isLoading = isLoadingProbes || isLoadingChecks;

  return useMemo<[ExtendedProbe[], boolean]>(() => {
    if (isLoadingProbes || isLoadingChecks) {
      return [[], isLoading];
    }

    const extendedProbes = probes.map((probe) => {
      return checks.reduce<ExtendedProbe>(
        (acc, check) => {
          if (probe.id && check.id && check.probes.includes(probe.id)) {
            acc.checks.push(check.id);
          }

          return acc;
        },
        { ...probe, checks: [] }
      );
    });

    return [extendedProbes, isLoading];
  }, [isLoadingProbes, isLoadingChecks, probes, isLoading, checks]);
}

export function useExtendedProbe(id: number): [ExtendedProbe | undefined, boolean] {
  const [probes, isLoading] = useExtendedProbes();
  const probe = probes.find((probe) => probe.id === id);

  return useMemo(() => {
    return [probe, isLoading];
  }, [probe, isLoading]);
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
        return await smDS.addProbe({
          ...probe,
          public: false,
        });
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

  return useMutation<ExtendedDeleteProbeResult, DeleteProbeError, Probe, UseMutationResult>({
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
