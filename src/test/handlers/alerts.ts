import { db } from 'test/db';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';

import { ApiEntry } from 'test/handlers/types';
import { CheckAlertsResponse } from 'datasource/responses.types';

export const listAlertsForCheck: ApiEntry<CheckAlertsResponse> = {
  route: `/sm/check/:checkId/alerts`,
  method: `get`,
  result: () => {
    return {
      json: BASIC_CHECK_ALERTS,
    };
  },
};

export const updateAlertsForCheck: ApiEntry<CheckAlertsResponse> = {
  route: `/sm/check/:checkId/alerts`,
  method: `post`,
  result: (req) => {
    const checkId = req.params.checkId;
    const alert = db.alert.findFirst({
      where: {
        id: {
          equals: +checkId,
        },
      },
    });

    return {
      json: alert,
    };
  },
};
