import { KG_FRONTEND_APPS } from 'test/fixtures/knowledgeGraph';

import { ApiEntry } from './types';

const KG_API_BASE = '/api/plugins/grafana-asserts-app/resources/asserts/api-server';

export const searchKnowledgeGraphEntities: ApiEntry = {
  route: `${KG_API_BASE}/v1/search`,
  method: 'post',
  result: async (request) => {
    const body = await request.json();
    if (!body.filterCriteria?.[0]?.propertyMatchers?.length) {
      return { status: 422 };
    }
    return {
      json: {
        data: {
          entities: body.filterCriteria?.[0]?.entityType === 'Frontend' ? KG_FRONTEND_APPS : [],
          lastPage: true,
        },
      },
    };
  },
};

export const getKnowledgeGraphPropertyValues: ApiEntry = {
  route: `${KG_API_BASE}/v1/entity_type/property_values`,
  method: 'post',
  result: () => ({ json: { values: [] } }),
};
