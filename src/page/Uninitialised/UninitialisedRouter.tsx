import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ROUTES } from 'types';
import { useMeta } from 'hooks/useMeta';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';
import { getRoute } from 'components/Routing.utils';
import { AlertingWelcomePage } from 'page/AlertingWelcomePage';
import { ChecksWelcomePage } from 'page/ChecksWelcomePage';
import { ConfigPage } from 'page/ConfigPage';
import { ProbesWelcomePage } from 'page/ProbesWelcomePage';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';

export const UninitialisedRouter = () => {
  // todo: is this the correct check for provisioning?
  const meta = useMeta();
  const provisioned = Boolean(meta.jsonData?.metrics?.grafanaName);

  if (!provisioned) {
    return <UnprovisionedSetup />;
  }

  return (
    <Switch>
      <Route exact path={getRoute(ROUTES.Home)}>
        <WelcomePage />
      </Route>
      <Route path={getRoute(ROUTES.Scene)}>
        <WelcomePage />
      </Route>
      <Route path={getRoute(ROUTES.Checks)}>
        <ChecksWelcomePage />
      </Route>
      <Route path={getRoute(ROUTES.Probes)}>
        <ProbesWelcomePage />
      </Route>
      <Route exact path={getRoute(ROUTES.Alerts)}>
        <AlertingWelcomePage />
      </Route>
      <Route path={getRoute(ROUTES.Config)}>
        <ConfigPage />
      </Route>

      {/* Default route (only redirect if the path matches the plugin's URL) */}
      <Route path={PLUGIN_URL_PATH}>
        <Redirect to={getRoute(ROUTES.Home)} />
      </Route>
    </Switch>
  );
};
