import { useContext } from 'react';
import { type QueryKey, useMutation, UseMutationResult, useSuspenseQuery } from '@tanstack/react-query';

import { type MutationProps } from 'data/types';
import type { ThresholdSettings } from 'types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import type { UpdateTenantSettingsResult } from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';
import { queryClient } from 'data/queryClient';

const queryKeys: Record<string, () => QueryKey> = {
  list: () => ['thresholds'],
};

export function useThresholds() {
  const { instance } = useContext(InstanceContext);

  return useSuspenseQuery({
    queryKey: queryKeys.list(),
    queryFn: () => instance.api?.getTenantSettings(),
  });
}

export function useThreshold(type: keyof ThresholdSettings) {
  const props = useThresholds();
  const threshold = props.data?.thresholds[type];

  return {
    ...props,
    data: threshold,
  };
}

export function useUpdateThresholds({ onError, onSuccess }: MutationProps<UpdateTenantSettingsResult> = {}) {
  const { instance } = useContext(InstanceContext);
  const api = instance.api as SMDataSource;
  const event = FaroEvent.SAVE_THRESHOLDS;

  return useMutation<UpdateTenantSettingsResult, Error, ThresholdSettings, UseMutationResult>({
    mutationFn: (thresholds: ThresholdSettings) => api.updateTenantSettings({ thresholds }),
    onError: (error: unknown) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list() });
      onSuccess?.(data);
    },
    meta: {
      event,
      successAlert: () => `Threshold settings updated.`,
      errorAlert: () => `Failed to update threshold settings.`,
    },
  });
}
