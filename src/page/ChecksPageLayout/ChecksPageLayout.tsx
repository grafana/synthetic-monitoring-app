import React from 'react';
import { Outlet } from 'react-router';

import { AppRoutes } from 'routing/types';
import { useActiveTab } from 'hooks/useActiveTab';
import { SyntheticsTab } from 'page/SyntheticsPageNav';
import { SyntheticsPluginPage } from 'page/SyntheticsPluginPage';

// Only the tabbed routes sit under this; the editor and dashboards keep their own page chrome.
export function ChecksPageLayout() {
  const activeTab = useActiveTab(AppRoutes.Checks);

  return (
    <SyntheticsPluginPage
      activeTab={activeTab('recommendations') ? SyntheticsTab.Recommendations : SyntheticsTab.Checks}
    >
      <Outlet />
    </SyntheticsPluginPage>
  );
}
