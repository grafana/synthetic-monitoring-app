import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { KG_PLUGIN_ID } from './knowledgeGraph.constants';

const KG_API_BASE = `/api/plugins/${KG_PLUGIN_ID}/resources/asserts/api-server`;
const PROPERTY_VALUES_URL = `${KG_API_BASE}/v1/entity_type/property_values`;
const ONE_HOUR_MS = 60 * 60 * 1000;

interface EntityPropertyValuesResponse {
  values?: string[];
}

async function fetchServicePropertyValues(propertyName: 'name' | 'namespace', prefix?: string): Promise<string[]> {
  try {
    const now = Date.now();
    const response = await firstValueFrom(
      getBackendSrv().fetch<EntityPropertyValuesResponse>({
        url: PROPERTY_VALUES_URL,
        method: 'POST',
        data: {
          entityType: 'Service',
          propertyName,
          prefix: prefix || '',
          start: now - ONE_HOUR_MS,
          end: now,
          limit: 50,
        },
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );

    return response.data.values ?? [];
  } catch {
    return [];
  }
}

export function fetchServiceNames(prefix?: string): Promise<string[]> {
  return fetchServicePropertyValues('name', prefix);
}

export function fetchServiceNamespaces(prefix?: string): Promise<string[]> {
  return fetchServicePropertyValues('namespace', prefix);
}
