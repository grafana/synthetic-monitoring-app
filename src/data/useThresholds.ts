import { type QueryKey, useMutation, UseMutationResult, useQuery } from '@tanstack/react-query';

import { type MutationProps } from 'data/types';
import type { ThresholdSettings } from 'types';
import { FaroEvent } from 'faro';
import type { UpdateTenantSettingsResult } from 'datasource/responses.types';
import { queryClient } from 'data/queryClient';

import { useSyntheticMonitoringDS } from './useSyntheticMonitoringDS';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['thresholds'],
};

export function useThresholds() {
  const smDS = useSyntheticMonitoringDS();

  return useQuery({
    queryKey: queryKeys.list,
    queryFn: () => smDS.getTenantSettings(),
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
  const smDS = useSyntheticMonitoringDS();
  const eventType = FaroEvent.SAVE_THRESHOLDS;

  return useMutation<UpdateTenantSettingsResult, Error, ThresholdSettings, UseMutationResult>({
    mutationFn: (thresholds: ThresholdSettings) => smDS.updateTenantSettings({ thresholds }),
    onError: (error: unknown) => {
      onError?.(error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.list });
      onSuccess?.(data);
    },
    meta: {
      event: {
        type: eventType,
      },
      successAlert: () => `Threshold settings updated.`,
      errorAlert: () => `Failed to update threshold settings.`,
    },
  });
}
