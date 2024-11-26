import { getUserPermissions } from 'data/permissions';

import { useDSPermission } from './useDSPermission';

export function useAlertPermissions() {
  const { canReadAlerts, canWriteAlerts, canDeleteAlerts } = getUserPermissions();
  const canEditAlertInDs = useDSPermission(`metrics`, `alert.instances.external:write`);

  return {
    canReadAlerts,
    canWriteAlerts: canWriteAlerts && canEditAlertInDs,
    canDeleteAlerts: canDeleteAlerts && canEditAlertInDs,
  };
}
