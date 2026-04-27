import { useEffect } from 'react';

import { ensureKnowledgeGraphProvisioning } from './knowledgeGraph';

export function useKnowledgeGraphProvisioning() {
  useEffect(() => {
    ensureKnowledgeGraphProvisioning().catch(() => {});
  }, []);
}
