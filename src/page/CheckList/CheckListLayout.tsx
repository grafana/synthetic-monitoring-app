import React from 'react';
import { matchPath, Outlet, useLocation } from 'react-router';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { SyntheticsTab } from 'page/SyntheticsPageNav';
import { SyntheticsPluginPage } from 'page/SyntheticsPluginPage';

export function CheckListLayout() {
  const { pathname } = useLocation();
  const isRecommendations = Boolean(
    matchPath({ path: getRoute(AppRoutes.CheckRecommendations), end: true }, pathname)
  );
  const isCheckList = Boolean(matchPath({ path: getRoute(AppRoutes.Checks), end: true }, pathname));

  if (!isCheckList && !isRecommendations) {
    return <Outlet />;
  }

  return (
    <SyntheticsPluginPage
      activeTab={isRecommendations ? SyntheticsTab.Recommendations : SyntheticsTab.Checks}
    >
      <Outlet />
    </SyntheticsPluginPage>
  );
}
