import { Label } from 'types';

import { fetchServiceNames, fetchServiceNamespaces } from './knowledgeGraphApi';

export { KG_NAMESPACE_LABEL, KG_PLUGIN_ID, KG_SERVICE_NAME_LABEL } from './knowledgeGraph.constants';

export function findLabelValue(labels: Label[], name: string): string | undefined {
  return labels.find((l) => l.name === name)?.value || undefined;
}

export function fetchKGServiceNames(prefix?: string): Promise<string[]> {
  return fetchServiceNames(prefix);
}

export function fetchKGServiceNamespaces(prefix?: string): Promise<string[]> {
  return fetchServiceNamespaces(prefix);
}
