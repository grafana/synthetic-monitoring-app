import { renderHook, waitFor } from '@testing-library/react';

import { useScreenshots } from './screenshots.hooks';

const mockQueryLogsV2 = jest.fn();

jest.mock('hooks/useSMDS', () => ({
  useSMDS: () => ({
    queryLogsV2: mockQueryLogsV2,
  }),
}));

function buildLokiResponse(lines: string[]) {
  return {
    results: {
      A: {
        frames: [
          {
            schema: { fields: [{ name: 'time' }, { name: 'line' }] },
            data: { values: [lines.map(() => Date.now()), lines] },
          },
        ],
      },
    },
  };
}

describe('useScreenshots', () => {
  beforeEach(() => {
    mockQueryLogsV2.mockReset();
  });

  const from = 1700000000000;
  const to = 1700000060000;

  it('returns empty map when no UUIDs are provided', () => {
    const { result } = renderHook(() => useScreenshots([], from, to));
    expect(result.current.size).toBe(0);
    expect(mockQueryLogsV2).not.toHaveBeenCalled();
  });

  it('fetches and assembles base64 screenshot from Loki', async () => {
    const screenshotLine = JSON.stringify({
      id: 'loki-uuid-1',
      screenshot_base64: 'iVBORw0KGgo=',
      caption: 'Loki screenshot',
    });

    mockQueryLogsV2.mockResolvedValue(buildLokiResponse([screenshotLine]));

    const { result } = renderHook(() => useScreenshots(['loki-uuid-1'], from, to));

    await waitFor(() => expect(result.current.size).toBe(1));

    const screenshot = result.current.get('loki-uuid-1');
    expect(screenshot?.screenshot_base64).toBe('iVBORw0KGgo=');
    expect(screenshot?.caption).toBe('Loki screenshot');
    expect(mockQueryLogsV2).toHaveBeenCalledWith(
      expect.stringContaining('loki-uuid-1'),
      from,
      to
    );
  });

  it('fetches URL-based screenshot (GCS flow)', async () => {
    const screenshotLine = JSON.stringify({
      id: 'gcs-uuid-1',
      screenshot_url: 'https://storage.googleapis.com/my-bucket/gcs-uuid-1.png',
      caption: 'GCS screenshot',
    });

    mockQueryLogsV2.mockResolvedValue(buildLokiResponse([screenshotLine]));

    const { result } = renderHook(() => useScreenshots(['gcs-uuid-1'], from, to));

    await waitFor(() => expect(result.current.size).toBe(1));

    const screenshot = result.current.get('gcs-uuid-1');
    expect(screenshot?.screenshot_url).toBe('https://storage.googleapis.com/my-bucket/gcs-uuid-1.png');
    expect(screenshot?.caption).toBe('GCS screenshot');
    expect(screenshot?.screenshot_base64).toBeUndefined();
  });

  it('handles chunked base64 screenshots', async () => {
    const chunk0 = JSON.stringify({
      id: 'chunked-uuid',
      screenshot_base64: 'AAAA',
      caption: 'Chunked',
      chunk_index: 0,
      chunk_total: 2,
    });
    const chunk1 = JSON.stringify({
      id: 'chunked-uuid',
      screenshot_base64: 'BBBB',
      caption: 'Chunked',
      chunk_index: 1,
      chunk_total: 2,
    });

    mockQueryLogsV2.mockResolvedValue(buildLokiResponse([chunk1, chunk0]));

    const { result } = renderHook(() => useScreenshots(['chunked-uuid'], from, to));

    await waitFor(() => expect(result.current.size).toBe(1));

    const screenshot = result.current.get('chunked-uuid');
    expect(screenshot?.screenshot_base64).toBe('AAAABBBB');
  });

  it('handles mix of base64 and URL screenshots in one query', async () => {
    const lokiLine = JSON.stringify({ id: 'loki-id', screenshot_base64: 'data123', caption: 'Loki' });
    const gcsLine = JSON.stringify({
      id: 'gcs-id',
      screenshot_url: 'https://storage.googleapis.com/bucket/gcs-id.png',
      caption: 'GCS',
    });

    mockQueryLogsV2.mockResolvedValue(buildLokiResponse([lokiLine, gcsLine]));

    const { result } = renderHook(() => useScreenshots(['loki-id', 'gcs-id'], from, to));

    await waitFor(() => expect(result.current.size).toBe(2));

    expect(result.current.get('loki-id')?.screenshot_base64).toBe('data123');
    expect(result.current.get('gcs-id')?.screenshot_url).toBe(
      'https://storage.googleapis.com/bucket/gcs-id.png'
    );
  });

  it('silently degrades when the query fails', async () => {
    mockQueryLogsV2.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useScreenshots(['fail-uuid'], from, to));

    // Wait a tick to ensure the effect has run
    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.size).toBe(0);
  });

  it('does not re-fetch already fetched UUIDs', async () => {
    const line = JSON.stringify({ id: 'uuid-once', screenshot_base64: 'data', caption: 'Once' });
    mockQueryLogsV2.mockResolvedValue(buildLokiResponse([line]));

    const { result, rerender } = renderHook(({ uuids }) => useScreenshots(uuids, from, to), {
      initialProps: { uuids: ['uuid-once'] },
    });

    await waitFor(() => expect(result.current.size).toBe(1));
    expect(mockQueryLogsV2).toHaveBeenCalledTimes(1);

    rerender({ uuids: ['uuid-once'] });

    // Should not trigger another fetch
    expect(mockQueryLogsV2).toHaveBeenCalledTimes(1);
  });
});
