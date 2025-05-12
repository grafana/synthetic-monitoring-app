import { useCallback, useMemo } from 'react';

import { Check, PrometheusAlertRecord } from 'types';
import { findRelevantAlertGroups, useAlerts } from 'data/useAlerts';
import { findRelevantAlertGroups as findRelevantAlertGroupsGM, useGMAlerts } from 'data/useGMAlerts';

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

export function useGMAlertRules(alerts: Check['Alerts']) {
  const { data, isLoading, isError, refetch } = useGMAlerts();

  return useMemo(() => {
    const groups = data ? findRelevantAlertGroupsGM(data.groups, alerts) : [];

    return {
      enabled: groups.length > 0,
      groups,
      isError,
      isLoading,
      refetch,
    };
  }, [data, isError, isLoading, refetch, alerts]);
}
