import { useCallback, useMemo } from 'react';

import { Check, PrometheusAlertRecord } from 'types';
import { findRelevantAlertGroups, useAlerts } from 'data/useAlerts';

export function useAlertRules(alertSensitivity: Check['alertSensitivity']) {
  const alertFilter = useCallback(
    (alert: PrometheusAlertRecord) => {
      return alert.query.includes(`alert_sensitivity=\"${alertSensitivity}\"`);
    },
    [alertSensitivity]
  );

  const { data, isLoading, isError, refetch } = useAlerts();

  return useMemo(() => {
    const groups = data ? findRelevantAlertGroups(data, alertFilter) : [];

    return {
      enabled: groups.length > 0,
      groups,
      isError,
      isLoading,
      refetch,
    };
  }, [data, isError, isLoading, alertFilter, refetch]);
}
