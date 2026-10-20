import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

import { SCREENSHOT_PATTERN } from './screenshots.constants';

export function extractScreenshotUUIDs<T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>(
  logs: T[],
  mainKey: string
): string[] {
  const uuids: string[] = [];

  for (const log of logs) {
    const message = log.labels[mainKey];
    const match = message?.match(SCREENSHOT_PATTERN);

    if (match?.[1]) {
      uuids.push(match[1]);
    }
  }

  return uuids;
}

/** Only allow HTTPS image URLs returned by Saga. */
export function sanitizeScreenshotSrc(url?: string): string | undefined {
  if (!url) {
    return undefined;
  }
  try {
    return new URL(url).protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}
