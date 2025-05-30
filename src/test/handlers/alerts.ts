import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';

import { ApiEntry } from 'test/handlers/types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const listAlertsForCheck: ApiEntry<CheckAlertsResponse> = {
  route: `/sm/check/\\d+/alerts`,
  method: `get`,
  result: () => {
    return {
      json: BASIC_CHECK_ALERTS,
    };
  },
};

export const updateAlertsForCheck: ApiEntry<null> = {
  route: `/sm/check/\\d+/alerts`,
  method: `put`,
  result: () => {
    return {
      json: null,
    };
  },
};
