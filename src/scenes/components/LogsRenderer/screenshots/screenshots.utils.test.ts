import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

import { extractScreenshotUUIDs, sanitizeScreenshotSrc } from './screenshots.utils';

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

describe('sanitizeScreenshotSrc', () => {
  it('allows HTTPS signed URLs', () => {
    const url = 'https://storage.example.com/capture.png?sig=example';
    expect(sanitizeScreenshotSrc(url)).toBe(url);
  });
  it.each([
    undefined,
    '',
    'not-a-url',
    'http://example.com/image.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    'blob:https://example.com/id',
    'ftp://example.com/image.png',
  ])('rejects %s', (url) => {
    expect(sanitizeScreenshotSrc(url)).toBeUndefined();
  });
});
