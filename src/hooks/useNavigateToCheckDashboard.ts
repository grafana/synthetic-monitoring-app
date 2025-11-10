import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { dateTimeFormat } from '@grafana/data';

import { AppRoutes } from '../routing/types';
import { Check } from '../types';

import { getAdditionalDuration } from '../components/CheckForm/CheckForm.utils';
import { DEFAULT_QUERY_FROM_TIME } from '../components/constants';
import { generateRoutePath } from '../routing/utils';
import { formatDuration } from '../utils';

export function useNavigateToCheckDashboard() {
  const navigate = useNavigate();
  return useCallback(
    (result: Check, isNew: boolean) => {
      const { frequency } = result;
      const additionalDuration = getAdditionalDuration(frequency, 20);
      const duration = formatDuration(additionalDuration, true);
      const created = Math.round(result.created! * 1000);
      const dateTime = dateTimeFormat(created, { format: 'yyyy-MM-DD HH:mm:ss', timeZone: `utc` });
      const from = isNew ? dateTime : `now$2B${DEFAULT_QUERY_FROM_TIME}`;

      navigate(
        `${generateRoutePath(AppRoutes.CheckDashboard, {
          id: result.id!,
        })}?from=${from}&to=now%2B${duration}`
      );
    },
    [navigate]
  );
}
