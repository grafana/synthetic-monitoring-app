import type { NavModelItem } from '@grafana/data';

import { AGENTIC_PLUGIN_ID, PERFORMANCE_PLUGIN_ID, SYNTHETICS_PLUGIN_ID } from './TestingAndSyntheticsLandingPage.constants';

export function getInstalledPlugins(node: NavModelItem) {
  const children = node?.children?.filter((child) => !child.hideFromTabs) ?? [];

  const hasAgentic = children.some(
    (child) => child.pluginId === AGENTIC_PLUGIN_ID
  );
  const hasK6 = children.some(
    (child) => child.pluginId === PERFORMANCE_PLUGIN_ID
  );
  const hasSynthetics = children.some(
    (child) => child.pluginId === SYNTHETICS_PLUGIN_ID
  );

  return { hasAgentic, hasK6, hasSynthetics };
}
