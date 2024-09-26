import { useGcomInstance, useGcomOrg } from 'data/useGcom';

export function useCurrentHGSubscription() {
  const { data: instanceData, isLoading: isLoadingInstance, error: errorInstance } = useGcomInstance();
  const { data: orgData, isLoading: isLoadingOrg, error: errorOrg } = useGcomOrg(instanceData?.orgId);
  const product = orgData?.subscriptions.current.product;

  return {
    isLoading: isLoadingInstance || isLoadingOrg,
    error: errorInstance || errorOrg,
    data: product,
  };
}
