import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { KG_PLUGIN_ID } from './knowledgeGraph.constants';

const KG_API_BASE = `/api/plugins/${KG_PLUGIN_ID}/resources/asserts/api-server`;
const PROPERTY_VALUES_URL = `${KG_API_BASE}/v1/entity_type/property_values`;
const ENTITY_SEARCH_URL = `${KG_API_BASE}/v1/search`;
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

interface EntitySearchResponse {
  data?: {
    entities?: Array<{
      name?: string;
      scope?: {
        namespace?: string;
      };
    }>;
  };
}

/**
 * Checks whether a Service entity with the given name (and namespace, when provided) currently
 * exists in the Knowledge Graph. `namespace` is a scope on Service entities rather than a plain
 * property, so it is matched client-side against the returned entities.
 *
 * Returns `null` when the lookup itself fails, so callers can distinguish "no match" from "unknown".
 */
export async function fetchServiceMatchExists(name: string, namespace?: string): Promise<boolean | null> {
  try {
    const now = Date.now();
    const response = await firstValueFrom(
      getBackendSrv().fetch<EntitySearchResponse>({
        url: ENTITY_SEARCH_URL,
        method: 'POST',
        data: {
          timeCriteria: { start: now - ONE_HOUR_MS, end: now },
          filterCriteria: [
            {
              entityType: 'Service',
              propertyMatchers: [
                { id: 0, name: 'name', op: 'IS NOT NULL', type: 'String', value: '' },
                { id: 0, name: 'name', op: '=', type: '', value: name },
              ],
            },
          ],
          pageNum: 0,
        },
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );

    const entities = response.data.data?.entities ?? [];
    return entities.some((entity) => !namespace || entity.scope?.namespace === namespace);
  } catch {
    return null;
  }
}
