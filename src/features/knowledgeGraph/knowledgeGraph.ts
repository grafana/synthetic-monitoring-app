import { isAppPluginInstalled } from '@grafana/runtime';

import { Check, KGEntity, Label } from 'types';

import {
  createEntityRule,
  createLogConfig,
  entityRuleExists,
  fetchEntity,
  fetchServiceNames,
  fetchServiceNamespaces,
  logConfigExists,
} from './knowledgeGraphApi';

export const KG_PLUGIN_ID = 'grafana-asserts-app';
export const KG_SERVICE_NAME_LABEL = 'service_name';
export const KG_NAMESPACE_LABEL = 'namespace';

let provisioningAttempted = false;
let kgAvailable: boolean | undefined;

export async function resolveKnowledgeGraphAvailability(): Promise<boolean> {
  if (kgAvailable === undefined) {
    kgAvailable = await isAppPluginInstalled(KG_PLUGIN_ID);
  }
  return kgAvailable;
}

export function isKnowledgeGraphAvailable(): boolean {
  return kgAvailable ?? false;
}

export function getEntityName(target: string): string {
  try {
    return new URL(target).host;
  } catch {
    return target;
  }
}

export function findLabelValue(labels: Label[], name: string): string | undefined {
  return labels.find((l) => l.name === name)?.value || undefined;
}

export function buildKGEntityGraphUrl(check: Check): string {
  const params = new URLSearchParams();
  params.set('start', 'now-1h');
  params.set('end', 'now');
  params.set('view', 'graph');

  params.set('filterCriteria[0][entityType]', 'SyntheticCheck');
  params.set('filterCriteria[0][propertyMatchers][0][name]', 'name');
  params.set('filterCriteria[0][propertyMatchers][0][type]', 'String');
  params.set('filterCriteria[0][propertyMatchers][0][value]', getEntityName(check.target));
  params.set('filterCriteria[0][propertyMatchers][0][id]', '1');
  params.set('filterCriteria[0][propertyMatchers][0][op]', '=');
  params.set('filterCriteria[0][propertyMatchers][1][name]', 'job');
  params.set('filterCriteria[0][propertyMatchers][1][type]', 'String');
  params.set('filterCriteria[0][propertyMatchers][1][value]', check.job);
  params.set('filterCriteria[0][propertyMatchers][1][id]', '2');
  params.set('filterCriteria[0][propertyMatchers][1][op]', '=');
  params.set('filterCriteria[0][havingAssertion]', 'false');

  const serviceName = check.labels.find((l) => l.name === KG_SERVICE_NAME_LABEL)?.value;
  if (serviceName) {
    params.set('filterCriteria[0][connectToEntityTypes][0]', 'Service');
    let matcherId = 3;
    params.set('filterCriteria[1][entityType]', 'Service');
    params.set('filterCriteria[1][propertyMatchers][0][name]', 'name');
    params.set('filterCriteria[1][propertyMatchers][0][type]', 'String');
    params.set('filterCriteria[1][propertyMatchers][0][value]', serviceName);
    params.set('filterCriteria[1][propertyMatchers][0][id]', String(matcherId++));
    params.set('filterCriteria[1][propertyMatchers][0][op]', '=');

    const namespace = check.labels.find((l) => l.name === KG_NAMESPACE_LABEL)?.value;
    if (namespace) {
      params.set('filterCriteria[1][propertyMatchers][1][name]', 'namespace');
      params.set('filterCriteria[1][propertyMatchers][1][type]', 'String');
      params.set('filterCriteria[1][propertyMatchers][1][value]', namespace);
      params.set('filterCriteria[1][propertyMatchers][1][id]', String(matcherId));
      params.set('filterCriteria[1][propertyMatchers][1][op]', '=');
    }

    const serviceConnectedTypes = ['Namespace', 'Pod', 'Service', 'ServiceInstance', 'SyntheticCheck'];
    serviceConnectedTypes.forEach((type, i) => {
      params.set(`filterCriteria[1][connectToEntityTypes][${i}]`, type);
    });
    params.set('filterCriteria[1][havingAssertion]', 'false');
  }

  const queryString = params.toString().replace(/%5B/g, '[').replace(/%5D/g, ']');
  return `/a/${KG_PLUGIN_ID}/entities?${queryString}`;
}

export async function ensureKnowledgeGraphProvisioning(): Promise<void> {
  await resolveKnowledgeGraphAvailability();

  if (provisioningAttempted || !isKnowledgeGraphAvailable()) {
    return;
  }

  provisioningAttempted = true;

  const [entityExists, logExists] = await Promise.all([entityRuleExists(), logConfigExists()]);

  await Promise.allSettled([!entityExists && createEntityRule(), !logExists && createLogConfig()]);
}

export async function fetchKGServiceNames(prefix?: string): Promise<string[]> {
  if (!isKnowledgeGraphAvailable()) {
    return [];
  }
  return fetchServiceNames(prefix);
}

export async function fetchKGServiceNamespaces(prefix?: string): Promise<string[]> {
  if (!isKnowledgeGraphAvailable()) {
    return [];
  }
  return fetchServiceNamespaces(prefix);
}

export async function fetchKGEntity(
  entityType: string,
  entityName: string,
  knownScope?: Record<string, string>
): Promise<KGEntity | null> {
  if (!isKnowledgeGraphAvailable()) {
    return null;
  }
  return fetchEntity(entityType, entityName, knownScope);
}
