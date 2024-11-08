import { useDSPermission } from './useDSPermission';
import { getUserPermissions } from './useUserPermissions';

export function useAlertPermissions() {
  const { canReadAlerts, canWriteAlerts, canDeleteAlerts } = getUserPermissions();
  const canEditAlertInDs = useDSPermission(`metrics`, `alert.instances.external:write`);

  return {
    canReadAlerts,
    canWriteAlerts: canWriteAlerts && canEditAlertInDs,
    canDeleteAlerts: canDeleteAlerts && canEditAlertInDs,
  };
}
