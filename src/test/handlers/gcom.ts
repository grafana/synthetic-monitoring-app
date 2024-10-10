import { INSTANCE_RESPONSE, ORG_RESPONSE_PRO } from 'test/fixtures/gcom';

import { RelevantInstanceResponse, RelevantOrgResponse } from 'data/useGcom.types';
import { ApiEntry } from 'test/handlers/types';

export const getInstance: ApiEntry<RelevantInstanceResponse> = {
  route: `/api/plugin-proxy/cloud-home-app/grafanacom-api/instance`,
  method: `get`,
  result: (req) => {
    return {
      json: INSTANCE_RESPONSE,
    };
  },
};

export const getOrg: ApiEntry<RelevantOrgResponse> = {
  route: `/api/plugin-proxy/cloud-home-app/grafanacom-api/orgs/*`,
  method: `get`,
  result: (req) => {
    return {
      json: ORG_RESPONSE_PRO,
    };
  },
};
