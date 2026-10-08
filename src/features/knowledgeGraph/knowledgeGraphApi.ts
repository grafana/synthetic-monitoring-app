import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { ONE_HOUR_IN_MS } from 'utils.constants';

import { KG_FRONTEND_ENTITY_TYPE, KG_PLUGIN_ID } from './knowledgeGraph.constants';

const KG_API_BASE = `/api/plugins/${KG_PLUGIN_ID}/resources/asserts/api-server`;
const PROPERTY_VALUES_URL = `${KG_API_BASE}/v1/entity_type/property_values`;
const ENTITY_SEARCH_URL = `${KG_API_BASE}/v1/search`;

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
          start: now - ONE_HOUR_IN_MS,
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
    lastPage?: boolean;
    entities?: Array<{
      name?: string;
      scope?: {
        namespace?: string;
        env?: string;
      };
      properties?: { feo11y_app_id?: string };
    }>;
  };
}

export interface KGFrontendApp {
  id: string;
  name: string;
  environments: string[];
}

/** A check links by app ID across environments, matching the KG relation rule. */
export async function fetchFrontendApps(): Promise<KGFrontendApp[]> {
  const now = Date.now();
  const apps = new Map<string, KGFrontendApp>();
  let pageNum = 0;
  let lastPage = false;

  while (!lastPage) {
    const response = await firstValueFrom(
      getBackendSrv().fetch<EntitySearchResponse>({
        url: ENTITY_SEARCH_URL,
        method: 'POST',
        data: {
          timeCriteria: { start: now - ONE_HOUR_IN_MS, end: now },
          filterCriteria: [
            {
              entityType: KG_FRONTEND_ENTITY_TYPE,
              propertyMatchers: [{ id: 0, name: 'name', op: 'IS NOT NULL', type: 'String', value: '' }],
            },
          ],
          pageNum,
        },
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );

    const entities = response.data.data?.entities ?? [];
    for (const entity of entities) {
      const id = entity.properties?.feo11y_app_id;
      if (!id || !entity.name) {
        continue;
      }
      const app = apps.get(id) ?? { id, name: entity.name, environments: [] };
      const env = entity.scope?.env;
      if (env && !app.environments.includes(env)) {
        app.environments.push(env);
      }
      apps.set(id, app);
    }
    lastPage = response.data.data?.lastPage !== false || entities.length === 0;
    pageNum++;
  }

  return [...apps.values()]
    .map((app) => ({ ...app, environments: app.environments.sort() }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
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
          timeCriteria: { start: now - ONE_HOUR_IN_MS, end: now },
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
