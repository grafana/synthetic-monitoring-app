import { ScreenshotChunk, ScreenshotData } from './screenshots.types';
import { LokiFieldNames, LokiFieldNamesOld, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

import { SCREENSHOT_LABEL_KEYS, SCREENSHOT_PATTERN } from './screenshots.constants';

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

export function extractFrameLines(result: unknown): unknown[] {
  const res = result as { results?: { A?: { frames?: Array<{ data?: { values?: unknown[][] }; schema?: { fields?: Array<{ name: string }> } }> } } };
  const frame = res?.results?.A?.frames?.[0];

  if (!frame) {
    return [];
  }

  const values = frame.data?.values;

  if (!values?.length) {
    return [];
  }

  const lineIndex = frame.schema?.fields?.findIndex(
    (f) => f.name === LokiFieldNames.Body || f.name === LokiFieldNamesOld.Line
  );

  if (lineIndex === undefined || lineIndex < 0 || !values[lineIndex]) {
    return [];
  }

  return values[lineIndex];
}

export function assembleChunkedScreenshots(lines: unknown[]): Map<string, ScreenshotData> {
  const dataMap = new Map<string, ScreenshotData>();
  const chunksByUUID = new Map<string, ScreenshotChunk[]>();

  for (const line of lines) {
    if (typeof line !== 'string') {
      continue;
    }

    try {
      const parsed = JSON.parse(line);
      const uuid = parsed.id;

      if (!uuid) {
        continue;
      }

      if (parsed.chunk_total !== undefined && parsed.chunk_index !== undefined) {
        if (!chunksByUUID.has(uuid)) {
          chunksByUUID.set(uuid, []);
        }
        chunksByUUID.get(uuid)!.push({ index: parsed.chunk_index, data: parsed });
      } else {
        dataMap.set(uuid, parsed);
      }
    } catch {
      // Skip unparseable lines
    }
  }

  chunksByUUID.forEach((chunks, uuid) => {
    chunks.sort((a, b) => a.index - b.index);

    const firstChunk = chunks[0].data;
    const expectedTotal = firstChunk.chunk_total;

    if (chunks.length === expectedTotal) {
      const assembledBase64 = chunks.map((c) => c.data.screenshot_base64 || '').join('');
      const { chunk_index: _ci, chunk_total: _ct, ...metadata } = firstChunk;
      dataMap.set(uuid, { ...metadata, screenshot_base64: assembledBase64 });
    }
  });

  return dataMap;
}

/**
 * Only allow https: URLs for screenshot sources. Falls back to a data: URI
 * from base64 content, or undefined if neither source is usable.
 */
export function sanitizeScreenshotSrc(url?: string, base64?: string): string | undefined {
  if (url) {
    try {
      const parsed = new URL(url);

      if (parsed.protocol === 'https:') {
        return url;
      }
    } catch {
      // Invalid URL — fall through to base64
    }
  }

  if (base64) {
    return `data:image/png;base64,${base64}`;
  }

  return undefined;
}

/**
 * Picks only the label keys that the screenshot UI needs, avoiding leaking
 * internal metadata (id, level, message, timestamp, etc.) into the label renderer.
 */
export function pickScreenshotLabels(data: ScreenshotData): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key of SCREENSHOT_LABEL_KEYS) {
    const value = data[key];

    if (value) {
      result[key] = value;
    }
  }

  return result;
}
