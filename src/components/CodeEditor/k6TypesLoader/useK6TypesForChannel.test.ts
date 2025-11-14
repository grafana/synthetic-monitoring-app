import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from 'test/render';

import { useK6TypesForChannel } from './useK6TypesForChannel';

jest.mock('./k6TypesCdnLoader', () => ({
  fetchK6TypesFromCDN: jest.fn(),
}));

import { fetchK6TypesFromCDN } from './k6TypesCdnLoader';
const mockFetchK6TypesFromCDN = fetchK6TypesFromCDN as jest.MockedFunction<typeof fetchK6TypesFromCDN>;

describe('useK6TypesForChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null state when no channel provided', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useK6TypesForChannel(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).not.toBe(true);
    });

    expect(result.current.types).toBeNull();
    expect(result.current.version).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return null state when disabled', async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useK6TypesForChannel('v1', false), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).not.toBe(true);
    });

    expect(result.current.types).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should fetch types for valid channel', async () => {
    const mockTypes = { 'k6': 'export interface K6 {}', 'k6/http': 'export interface Http {}' };
    mockFetchK6TypesFromCDN.mockResolvedValue(mockTypes);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useK6TypesForChannel('v1'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).not.toBe(true);
    });

    expect(result.current.types).toEqual(mockTypes);
    expect(result.current.version).toBe('v1');
    expect(result.current.error).toBeNull();
    expect(mockFetchK6TypesFromCDN).toHaveBeenCalledWith('v1');
  });

  it('should handle CDN fetch errors', async () => {
    mockFetchK6TypesFromCDN.mockRejectedValue(new Error('CDN unavailable'));

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useK6TypesForChannel('v1'), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.loading).not.toBe(true);
    });

    expect(result.current.types).toBeNull();
    expect(result.current.error).toBe('CDN unavailable');
    expect(result.current.version).toBe('v1');
  });
});
