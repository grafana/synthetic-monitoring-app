import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

import {
  assembleChunkedScreenshots,
  extractFrameLines,
  extractScreenshotUUIDs,
  sanitizeScreenshotSrc,
} from './screenshots.utils';

function makeMockLog(msg: string): ParsedLokiRecord<Record<string, string>, Record<string, string>> {
  return {
    [LokiFieldNames.TimeStamp]: Date.now(),
    [LokiFieldNames.Body]: '',
    nanos: 0,
    labels: { msg, detected_level: 'info' },
    labelTypes: {},
    id: 'test-id',
  };
}

describe('extractScreenshotUUIDs', () => {
  it('extracts UUIDs from logs that match the screenshot pattern', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    const logs = [makeMockLog(`screenshot:${uuid}`), makeMockLog('some normal log'), makeMockLog('another log')];

    const result = extractScreenshotUUIDs(logs, 'msg');
    expect(result).toEqual([uuid]);
  });

  it('returns empty array when no logs match', () => {
    const logs = [makeMockLog('no screenshots here'), makeMockLog('nor here')];

    const result = extractScreenshotUUIDs(logs, 'msg');
    expect(result).toEqual([]);
  });

  it('extracts multiple UUIDs from different logs', () => {
    const uuid1 = '12345678-1234-1234-1234-123456789abc';
    const uuid2 = 'abcdef01-2345-6789-abcd-ef0123456789';
    const logs = [makeMockLog(`screenshot:${uuid1}`), makeMockLog(`screenshot:${uuid2}`)];

    const result = extractScreenshotUUIDs(logs, 'msg');
    expect(result).toEqual([uuid1, uuid2]);
  });
});

describe('extractFrameLines', () => {
  const screenshotLine = '{"id":"test","screenshot_base64":"abc"}';

  it('extracts values from old schema (Line field)', () => {
    const result = {
      results: {
        A: {
          frames: [
            {
              schema: { fields: [{ name: 'time' }, { name: 'Line' }] },
              data: { values: [[1234567890], [screenshotLine]] },
            },
          ],
        },
      },
    };

    expect(extractFrameLines(result)).toEqual([screenshotLine]);
  });

  it('extracts values from new schema (body field)', () => {
    const result = {
      results: {
        A: {
          frames: [
            {
              schema: { fields: [{ name: 'labels' }, { name: 'timestamp' }, { name: 'body' }] },
              data: { values: [[{}], [1234567890], [screenshotLine]] },
            },
          ],
        },
      },
    };

    expect(extractFrameLines(result)).toEqual([screenshotLine]);
  });

  it('returns empty array for null/undefined result', () => {
    expect(extractFrameLines(null)).toEqual([]);
    expect(extractFrameLines(undefined)).toEqual([]);
    expect(extractFrameLines({})).toEqual([]);
  });

  it('returns empty array when no frames exist', () => {
    const result = { results: { A: { frames: [] } } };
    expect(extractFrameLines(result)).toEqual([]);
  });
});

describe('assembleChunkedScreenshots', () => {
  it('handles a single non-chunked screenshot', () => {
    const lines = [JSON.stringify({ id: 'uuid-1', screenshot_base64: 'abc123', caption: 'Test' })];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(1);
    expect(result.get('uuid-1')).toMatchObject({
      id: 'uuid-1',
      screenshot_base64: 'abc123',
      caption: 'Test',
    });
  });

  it('assembles chunked screenshots in correct order', () => {
    const lines = [
      JSON.stringify({ id: 'uuid-2', screenshot_base64: 'chunk2', chunk_index: 1, chunk_total: 2, caption: 'Test' }),
      JSON.stringify({ id: 'uuid-2', screenshot_base64: 'chunk1', chunk_index: 0, chunk_total: 2, caption: 'Test' }),
    ];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(1);

    const screenshot = result.get('uuid-2');
    expect(screenshot?.screenshot_base64).toBe('chunk1chunk2');
    expect(screenshot?.caption).toBe('Test');
    expect(screenshot).not.toHaveProperty('chunk_index');
    expect(screenshot).not.toHaveProperty('chunk_total');
  });

  it('skips incomplete chunked screenshots', () => {
    const lines = [
      JSON.stringify({ id: 'uuid-3', screenshot_base64: 'chunk1', chunk_index: 0, chunk_total: 3, caption: 'Test' }),
      JSON.stringify({ id: 'uuid-3', screenshot_base64: 'chunk2', chunk_index: 1, chunk_total: 3, caption: 'Test' }),
    ];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(0);
  });

  it('skips unparseable lines', () => {
    const lines = ['not json', '{"id": "valid", "screenshot_base64": "ok"}', null, 42];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(1);
    expect(result.get('valid')).toMatchObject({ screenshot_base64: 'ok' });
  });

  it('handles mix of chunked and non-chunked screenshots', () => {
    const lines = [
      JSON.stringify({ id: 'single', screenshot_base64: 'single-data', caption: 'Single' }),
      JSON.stringify({ id: 'chunked', screenshot_base64: 'part1', chunk_index: 0, chunk_total: 2 }),
      JSON.stringify({ id: 'chunked', screenshot_base64: 'part2', chunk_index: 1, chunk_total: 2 }),
    ];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(2);
    expect(result.get('single')?.screenshot_base64).toBe('single-data');
    expect(result.get('chunked')?.screenshot_base64).toBe('part1part2');
  });

  it('handles a URL-based screenshot (GCS flow)', () => {
    const lines = [
      JSON.stringify({
        id: 'gcs-uuid',
        screenshot_url: 'https://storage.googleapis.com/my-bucket/gcs-uuid.png',
        caption: 'GCS screenshot',
      }),
    ];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(1);

    const screenshot = result.get('gcs-uuid');
    expect(screenshot?.screenshot_url).toBe('https://storage.googleapis.com/my-bucket/gcs-uuid.png');
    expect(screenshot?.caption).toBe('GCS screenshot');
    expect(screenshot?.screenshot_base64).toBeUndefined();
  });

  it('handles mix of base64 and URL-based screenshots', () => {
    const lines = [
      JSON.stringify({ id: 'loki-uuid', screenshot_base64: 'base64data', caption: 'From Loki' }),
      JSON.stringify({
        id: 'gcs-uuid',
        screenshot_url: 'https://storage.googleapis.com/bucket/gcs-uuid.png',
        caption: 'From GCS',
      }),
    ];

    const result = assembleChunkedScreenshots(lines);
    expect(result.size).toBe(2);
    expect(result.get('loki-uuid')?.screenshot_base64).toBe('base64data');
    expect(result.get('gcs-uuid')?.screenshot_url).toBe('https://storage.googleapis.com/bucket/gcs-uuid.png');
  });
});

describe('sanitizeScreenshotSrc', () => {
  it('allows https URLs', () => {
    const url = 'https://storage.example.com/screenshots/abc.png';
    expect(sanitizeScreenshotSrc(url)).toBe(url);
  });

  it('rejects http URLs and falls back to base64', () => {
    expect(sanitizeScreenshotSrc('http://evil.com/img.png', 'abc123')).toBe('data:image/png;base64,abc123');
  });

  it('rejects javascript: URLs', () => {
    expect(sanitizeScreenshotSrc('javascript:alert(1)')).toBeUndefined();
  });

  it('rejects data: URLs passed as url prop', () => {
    expect(sanitizeScreenshotSrc('data:text/html,<script>alert(1)</script>')).toBeUndefined();
  });

  it('rejects invalid URLs and falls back to base64', () => {
    expect(sanitizeScreenshotSrc('not-a-url', 'fallback64')).toBe('data:image/png;base64,fallback64');
  });

  it('returns data URI when only base64 is provided', () => {
    expect(sanitizeScreenshotSrc(undefined, 'abc123')).toBe('data:image/png;base64,abc123');
  });

  it('returns undefined when neither url nor base64 is provided', () => {
    expect(sanitizeScreenshotSrc()).toBeUndefined();
    expect(sanitizeScreenshotSrc(undefined, undefined)).toBeUndefined();
    expect(sanitizeScreenshotSrc(undefined, '')).toBeUndefined();
  });

  it('prefers a valid https URL over base64', () => {
    const url = 'https://example.com/screenshot.png';
    expect(sanitizeScreenshotSrc(url, 'shouldNotBeUsed')).toBe(url);
  });

  it('rejects ftp: URLs', () => {
    expect(sanitizeScreenshotSrc('ftp://files.example.com/img.png')).toBeUndefined();
  });

  it('rejects blob: URLs', () => {
    expect(sanitizeScreenshotSrc('blob:https://example.com/uuid')).toBeUndefined();
  });
});
