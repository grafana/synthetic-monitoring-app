import { hasGlobalPermission } from 'utils';

import { useUserPermissions } from './useUserPermissions';

export function usePluginPermissions() {
  const canEditPlugin = hasGlobalPermission(`plugins:write`);
  const { canEnablePlugin, canDisablePlugin } = useUserPermissions();

  return {
    canEnablePlugin: canEditPlugin && canEnablePlugin,
    canDisablePlugin: canEditPlugin && canDisablePlugin,
    canEditPlugin,
  };
}
