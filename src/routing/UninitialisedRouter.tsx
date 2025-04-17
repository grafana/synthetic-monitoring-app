import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { AppRoutes } from 'routing/types';
import { useMeta } from 'hooks/useMeta';
import { AlertingWelcomePage } from 'page/AlertingWelcomePage';
import { ChecksWelcomePage } from 'page/ChecksWelcomePage';
import { ConfigPageLayout } from 'page/ConfigPageLayout';
import { UninitializedTab } from 'page/ConfigPageLayout/tabs/UninitializedTab';
import { ProbesWelcomePage } from 'page/ProbesWelcomePage';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';

export const UninitialisedRouter = () => {
  const meta = useMeta();
  const provisioned = Boolean(meta.jsonData?.metrics?.grafanaName);

  // todo: is this the correct check for provisioning?
  // todo: is this state even possible in Grafana v11?
  if (!provisioned) {
    return <UnprovisionedSetup />;
  }

  return (
    <Routes>
      <Route path={AppRoutes.Home} element={<WelcomePage />} />
      <Route path={AppRoutes.Scene} element={<WelcomePage />} />
      <Route path={AppRoutes.Checks} element={<ChecksWelcomePage />} />
      <Route path={AppRoutes.Probes} element={<ProbesWelcomePage />} />
      <Route path={AppRoutes.Alerts} element={<AlertingWelcomePage />} />
      <Route path={AppRoutes.Config} Component={ConfigPageLayout}>
        <Route index element={<UninitializedTab />} />
        <Route path="*" element={<Navigate to={AppRoutes.Home} />} />
      </Route>

      {/* TODO: Create 404 instead of navigating to home(?) */}
      <Route path="*" element={<Navigate to={AppRoutes.Home} />} />
    </Routes>
  );
};
