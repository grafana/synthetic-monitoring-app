import { getQueryClient,queryClient } from './queryClient';

describe('queryClient', () => {
  it('exposes a singleton in-memory client without a persister', () => {
    expect(queryClient).toBeDefined();
    expect(getQueryClient()).not.toBe(getQueryClient());
    expect(queryClient.getQueryCache()).toBeDefined();
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(Number.POSITIVE_INFINITY);
  });
});
