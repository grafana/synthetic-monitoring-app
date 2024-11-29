import { getUserPermissions } from 'data/permissions';

import { useDSPermission } from './useDSPermission';
import { useMetricsDS } from './useMetricsDS';

export function useAlertAccessControl() {
  const { canReadAlerts, canWriteAlerts, canDeleteAlerts } = getUserPermissions();
  const canEditAlertInDs = useDSPermission(`metrics`, `alert.instances.external:write`);

  const metricsDs = useMetricsDS();

  return {
    canReadAlerts: canReadAlerts && !!metricsDs,
    hasWriterRole: canWriteAlerts,
    canWriteAlerts: canWriteAlerts && canEditAlertInDs && !!metricsDs,
    canDeleteAlerts: canDeleteAlerts && canEditAlertInDs && !!metricsDs,
  };
}
