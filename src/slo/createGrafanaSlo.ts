import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import type { GrafanaSloCreateRequest, GrafanaSloCreateResponse } from './grafanaSlo.types';

const SLO_RESOURCES_CREATE_URL = '/api/plugins/grafana-slo-app/resources/v1/slo';

export class GrafanaSloApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GrafanaSloApiError';
    this.status = status;
  }
}

export async function createGrafanaSlo(body: GrafanaSloCreateRequest): Promise<GrafanaSloCreateResponse> {
  try {
    const response = await firstValueFrom(
      getBackendSrv().fetch<GrafanaSloCreateResponse>({
        url: SLO_RESOURCES_CREATE_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: body,
        showErrorAlert: false,
      })
    );
    if (!response.data?.uuid) {
      throw new GrafanaSloApiError('SLO API returned an unexpected response');
    }
    return response.data;
  } catch (e: unknown) {
    if (isFetchError(e)) {
      const data = e.data as { code?: number; error?: string; err?: string; message?: string } | undefined;
      const detail =
        data?.error ?? data?.err ?? data?.message ?? (typeof e.data === 'string' ? e.data : undefined);
      const msg = [e.status && `HTTP ${e.status}`, detail, e.statusText].filter(Boolean).join(': ') || 'SLO API request failed';
      throw new GrafanaSloApiError(msg, e.status);
    }
    throw e;
  }
}
