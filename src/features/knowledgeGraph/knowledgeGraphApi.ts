import { config, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { EntityPropertyValuesResponse, KGEntity } from 'types';

const KG_PLUGIN_ID = 'grafana-asserts-app';
const KG_API_BASE = `/api/plugins/${KG_PLUGIN_ID}/resources/asserts/api-server`;
const ENTITY_RULE_NAME = 'synthetic-checks';
const LOG_CONFIG_NAME = 'syntheticCheckLokiConfig';

const KG_URLS = {
  modelRules: `${KG_API_BASE}/v1/config/model-rules`,
  modelRule: (name: string) => `${KG_API_BASE}/v1/config/model-rules/${name}`,
  logConfig: `${KG_API_BASE}/v2/config/log`,
  propertyValues: `${KG_API_BASE}/v1/entity_type/property_values`,
  searchSample: `${KG_API_BASE}/v1/search/sample`,
  assertionsGraph: `${KG_API_BASE}/v1/assertions/graph`,
} as const;

const SYNTHETIC_CHECK_ENTITY_RULE = {
  name: ENTITY_RULE_NAME,
  entities: [
    {
      type: 'SyntheticCheck',
      name: 'instance',
      scope: {
        job: 'job',
      },
      definedBy: [
        {
          query: 'sm_check_info',
          labelValues: {
            check_type: 'check_name',
            job_name: 'job',
            target: 'instance',
            probe_location: 'probe',
            region: 'region',
            frequency: 'frequency',
            geohash: 'geohash',
            service_name: 'label_service_name',
            namespace: 'label_namespace',
          },
        },
      ],
    },
  ],
  relations: [
    {
      type: 'MONITORS',
      startEntityType: 'SyntheticCheck',
      endEntityType: 'Service',
      definedBy: {
        source: 'PROPERTY_MATCH',
        startEntityProperties: ['service_name', 'namespace'],
        endEntityProperties: ['name', 'namespace'],
      },
    },
  ],
};

interface SearchSampleResponse {
  entities: KGEntity[];
}

interface AssertionsGraphResponse {
  type: string;
  data: {
    entities: KGEntity[];
    edges: unknown[];
  };
}

export async function entityRuleExists(): Promise<boolean> {
  try {
    await firstValueFrom(
      getBackendSrv().fetch({
        url: KG_URLS.modelRule(ENTITY_RULE_NAME),
        method: 'GET',
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function createEntityRule(): Promise<void> {
  await firstValueFrom(
    getBackendSrv().fetch({
      url: KG_URLS.modelRules,
      method: 'PUT',
      data: SYNTHETIC_CHECK_ENTITY_RULE,
      showErrorAlert: false,
      showSuccessAlert: false,
    })
  );
}

function getSmLogsDataSourceUid(): string | undefined {
  const smPlugin = Object.values(config.datasources ?? {}).find((ds) => ds.type === 'synthetic-monitoring-datasource');
  const configuredUid = (smPlugin?.jsonData as { logs?: { uid?: string } })?.logs?.uid;

  if (configuredUid && config.datasources[configuredUid]) {
    return configuredUid;
  }

  const fallback = Object.values(config.datasources ?? {}).find(
    (ds) => ds.type === 'loki' && ds.uid === 'grafanacloud-logs'
  );
  return fallback?.uid;
}

export async function logConfigExists(): Promise<boolean> {
  try {
    const response = await firstValueFrom(
      getBackendSrv().fetch<{ logDrilldownConfigs: Array<{ name: string }> }>({
        url: KG_URLS.logConfig,
        method: 'GET',
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    return response.data?.logDrilldownConfigs?.some((c) => c.name === LOG_CONFIG_NAME) ?? false;
  } catch {
    return false;
  }
}

export async function createLogConfig(): Promise<void> {
  const lokiUid = getSmLogsDataSourceUid();
  if (!lokiUid) {
    return;
  }

  await firstValueFrom(
    getBackendSrv().fetch({
      url: KG_URLS.logConfig,
      method: 'POST',
      data: {
        name: LOG_CONFIG_NAME,
        priority: 100,
        defaultConfig: false,
        dataSourceUid: lokiUid,
        errorLabel: 'error',
        match: [{ property: 'asserts_entity_type', op: '=', values: ['SyntheticCheck'] }],
        entityPropertyToLogLabelMapping: {
          job_name: 'job',
          target: 'instance',
        },
        filterBySpanId: false,
        filterByTraceId: false,
      },
      showErrorAlert: false,
      showSuccessAlert: false,
    })
  );
}

export async function fetchServiceNames(prefix?: string): Promise<string[]> {
  try {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const response = await firstValueFrom(
      getBackendSrv().fetch<EntityPropertyValuesResponse>({
        url: KG_URLS.propertyValues,
        method: 'POST',
        data: {
          entityType: 'Service',
          propertyName: 'name',
          prefix: prefix || '',
          start: oneHourAgo,
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

export async function fetchServiceNamespaces(prefix?: string): Promise<string[]> {
  try {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const response = await firstValueFrom(
      getBackendSrv().fetch<EntityPropertyValuesResponse>({
        url: KG_URLS.propertyValues,
        method: 'POST',
        data: {
          entityType: 'Service',
          propertyName: 'namespace',
          prefix: prefix || '',
          start: oneHourAgo,
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

async function findEntityScope(entityType: string, entityName: string): Promise<Record<string, string> | null> {
  try {
    const now = Date.now();
    const response = await firstValueFrom(
      getBackendSrv().fetch<SearchSampleResponse>({
        url: KG_URLS.searchSample,
        method: 'POST',
        data: {
          timeCriteria: { start: now - 60 * 60 * 1000, end: now },
          filterCriteria: [
            {
              entityType,
              propertyMatchers: [{ name: 'name', value: entityName, op: '=' }],
            },
          ],
          sampleSize: 1,
        },
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    return response.data?.entities?.[0]?.scope ?? null;
  } catch {
    return null;
  }
}

export async function fetchEntity(
  entityType: string,
  entityName: string,
  knownScope?: Record<string, string>
): Promise<KGEntity | null> {
  try {
    const scope = knownScope ?? (await findEntityScope(entityType, entityName));
    if (!scope) {
      return null;
    }

    const now = Date.now();
    const response = await firstValueFrom(
      getBackendSrv().fetch<AssertionsGraphResponse>({
        url: KG_URLS.assertionsGraph,
        method: 'POST',
        data: {
          startTime: now - 60 * 60 * 1000,
          endTime: now,
          entityKeys: [{ type: entityType, name: entityName, scope }],
          includeConnectedAssertions: true,
        },
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );

    return response.data?.data?.entities?.[0] ?? null;
  } catch {
    return null;
  }
}
