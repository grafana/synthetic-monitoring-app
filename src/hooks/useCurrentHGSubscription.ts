import { useGcomInstance, useGcomOrg } from 'data/useGcom';

export function useCurrentHGSubscription() {
  const { data: instanceData, isLoading: instanceIsLoading, error: instanceError } = useGcomInstance();
  const { data: orgData, isLoading: orgIsLoading, error: orgError } = useGcomOrg(instanceData?.orgId);
  const product = orgData?.subscriptions.current.product;

  return {
    isLoading: instanceIsLoading || orgIsLoading,
    error: instanceError || orgError,
    data: product,
  };
}
