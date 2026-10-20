import { config, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom, timeout } from 'rxjs';

import { sanitizeScreenshotSrc } from './screenshots.utils';

export const INFINITY_DATASOURCE_TYPE = 'yesoreyeram-infinity-datasource';

/**
 * Proposed #710 integration seam: SM jsonData.screenshots.uid explicitly links the
 * provisioned Infinity instance. No well-known UID or arbitrary Infinity fallback.
 * Its server-side base URL must include the gateway's /saga prefix (no trailing /).
 */
export function getScreenshotDatasource(uid?: string) {
  return uid
    ? Object.values(config.datasources).find((ds) => ds.uid === uid && ds.type === INFINITY_DATASOURCE_TYPE)
    : undefined;
}

interface QueryResult {
  status?: number;
  error?: string;
  frames?: Array<{
    schema: { fields: Array<{ name: string }>; meta?: { custom?: { responseCodeFromServer?: number } } };
    data: { values: unknown[][] };
  }>;
}

function isMissing(result?: QueryResult) {
  return (
    result?.status === 404 || result?.frames?.some((frame) => frame.schema.meta?.custom?.responseCodeFromServer === 404)
  );
}

export class ScreenshotLookupError extends Error {
  constructor(public kind: 'missing' | 'error') {
    super(kind === 'missing' ? 'Screenshot unavailable' : 'Screenshot lookup failed');
  }
}

/** Infinity makes the authenticated GET on the server; no CAP token enters this query. */
export async function lookupSagaScreenshot(uuid: string, datasourceUID: string): Promise<{ id: string; url: string; expiresAt: number }> {
  const refId = uuid;
  const response = await firstValueFrom(
    getBackendSrv()
      .fetch<{ results: Record<string, QueryResult> }>({
        method: 'POST',
        url: 'api/ds/query',
        showErrorAlert: false,
        data: {
          // Use current time, not the historical execution range, for fresh signed URLs.
          from: String(Date.now()),
          to: String(Date.now()),
          queries: [
            {
              refId,
              datasource: { uid: datasourceUID, type: INFINITY_DATASOURCE_TYPE },
              type: 'json',
              source: 'url',
              parser: 'backend',
              format: 'table',
              url: `/api/v1alpha1/screenshots/${encodeURIComponent(uuid)}`,
              url_options: { method: 'GET' },
              root_selector: '',
              columns: ['uuid', 'url', 'url_expires_at'].map((name) => ({
                selector: name,
                text: name,
                type: 'string',
              })),
            },
          ],
        },
      })
      .pipe(timeout(15000))
  ).catch((error: unknown) => {
    // Grafana may return query errors inside a non-2xx response body.
    const failure = error as { data?: { results?: Record<string, QueryResult> } };
    const result = failure.data?.results?.[refId];
    throw new ScreenshotLookupError(isMissing(result) ? 'missing' : 'error');
  });
  const result = response.data.results?.[refId];
  if (isMissing(result)) {
    throw new ScreenshotLookupError('missing');
  }
  if (result?.error || (result?.status && result.status >= 400)) {
    throw new ScreenshotLookupError('error');
  }
  // A single-UUID lookup returns one frame with one metadata row.
  const frame = result?.frames?.[0];
  if (!frame || !frame.data.values[0]?.length) {
    throw new ScreenshotLookupError('missing');
  }

  const value = (name: string) =>
    frame.data.values[frame.schema.fields.findIndex((field) => field.name === name)]?.[0];
  const returnedUUID = value('uuid');
  const url = value('url');
  const expiry = value('url_expires_at');
  const expiresAt = typeof expiry === 'string' ? Date.parse(expiry) : NaN;

  if (
    typeof returnedUUID !== 'string' ||
    returnedUUID.toLowerCase() !== uuid.toLowerCase() ||
    typeof url !== 'string' ||
    !sanitizeScreenshotSrc(url) ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    throw new ScreenshotLookupError('error');
  }

  return { id: uuid, url, expiresAt };
}
