import { useEffect, useMemo, useState } from 'react';

import { Check, KGEntity, KGEntityData, KGEntityRelationship } from 'types';

import {
  fetchKGEntity,
  findLabelValue,
  getEntityName,
  isKnowledgeGraphAvailable,
  KG_SERVICE_NAME_LABEL,
} from './knowledgeGraph';

export function useKnowledgeGraphEntity(check: Check): KGEntityData | null {
  const serviceName = useMemo(() => findLabelValue(check.labels, KG_SERVICE_NAME_LABEL), [check.labels]);

  const [checkEntity, setCheckEntity] = useState<KGEntity | null>(null);
  const [serviceEntity, setServiceEntity] = useState<KGEntity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const target = check.target;
  const job = check.job;

  useEffect(() => {
    if (!isKnowledgeGraphAvailable()) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const entityName = getEntityName(target);

    async function load() {
      const [checkResult, serviceResult] = await Promise.all([
        fetchKGEntity('SyntheticCheck', entityName),
        serviceName ? fetchKGEntity('Service', serviceName) : Promise.resolve(null),
      ]);

      if (cancelled) {
        return;
      }

      setCheckEntity(checkResult);
      setServiceEntity(serviceResult);
      setIsLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [target, job, serviceName]);

  if (!isKnowledgeGraphAvailable()) {
    return null;
  }

  const relationships: KGEntityRelationship[] = [];

  if (serviceName) {
    relationships.push({
      relationshipType: 'MONITORS',
      entityType: 'Service',
      entityName: serviceName,
    });
  }

  if (checkEntity?.connectedEntityTypes) {
    for (const [entityType, count] of Object.entries(checkEntity.connectedEntityTypes)) {
      if (count === 0 || (entityType === 'Service' && serviceName)) {
        continue;
      }
      relationships.push({
        relationshipType: 'CONNECTED_TO',
        entityType,
        entityName: `${count} ${entityType}${count !== 1 ? 's' : ''}`,
      });
    }
  }

  return {
    serviceName,
    relationships,
    checkEntity,
    serviceEntity,
    isLoading,
  };
}
