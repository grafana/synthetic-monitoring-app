import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { ROUTES } from 'types';
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
      <Route path={ROUTES.Home} element={<WelcomePage />} />
      <Route path={ROUTES.Scene} element={<WelcomePage />} />
      <Route path={ROUTES.Checks} element={<ChecksWelcomePage />} />
      <Route path={ROUTES.Probes} element={<ProbesWelcomePage />} />
      <Route path={ROUTES.Alerts} element={<AlertingWelcomePage />} />
      <Route path={ROUTES.Config} Component={ConfigPageLayout}>
        <Route index element={<UninitializedTab />} />
        <Route path="*" element={<UninitializedTab />} />
      </Route>

      {/* TODO: Create 404 instead of navigating to home(?) */}
      <Route path="*" element={<Navigate to={ROUTES.Home} />} />
    </Routes>
  );
};
