import {
  ADD_PROBE_TOKEN_RESPONSE,
  DEFAULT_PROBES,
  PRIVATE_PROBE,
  UPDATED_PROBE_TOKEN_RESPONSE,
} from 'test/fixtures/probes';

import { ApiEntry } from 'test/handlers/types';
import { AddProbeResult, ListProbeResult, UpdateProbeResult } from 'datasource/responses.types';

export const listProbes: ApiEntry<ListProbeResult> = {
  route: `/sm/probe/list`,
  method: `get`,
  result: () => {
    return {
      json: DEFAULT_PROBES,
    };
  },
};

export const addProbe: ApiEntry<AddProbeResult> = {
  route: `/sm/probe/add`,
  method: `post`,
  result: () => {
    return {
      json: { probe: PRIVATE_PROBE, token: ADD_PROBE_TOKEN_RESPONSE },
    };
  },
};

export const updateProbe: ApiEntry<UpdateProbeResult> = {
  route: `/sm/probe/update`,
  method: `post`,
  result: (req) => {
    const updateVal = req.url.searchParams.get('reset-token') || {};

    if (updateVal === `true`) {
      return {
        json: { probe: PRIVATE_PROBE, token: UPDATED_PROBE_TOKEN_RESPONSE },
      };
    }

    return {
      json: { probe: PRIVATE_PROBE },
    };
  },
};
