import { useCallback, useMemo } from 'react';

import { AlertRecord, Check } from 'types';
import { findRelevantAlerts, useAlerts } from 'data/useAlerts';

export function useAlertRules(alertSensitivity: Check['alertSensitivity']) {
  const alertFilter = useCallback(
    (alert: AlertRecord) => {
      return alert.expr.includes(`alert_sensitivity=\"${alertSensitivity}\"`);
    },
    [alertSensitivity]
  );

  const { data } = useAlerts();

  return useMemo(() => {
    if (data) {
      const relevant = findRelevantAlerts(data, alertFilter);
      return relevant;
    }

    return [];
  }, [data, alertFilter]);
}
