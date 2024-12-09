import { hasGlobalPermission } from 'utils';
import { getUserPermissions } from 'data/permissions';

export function usePluginPermissionCanWrite() {
  const { canWritePlugin } = getUserPermissions();

  return hasGlobalPermission(`plugins:write`) && canWritePlugin;
}
