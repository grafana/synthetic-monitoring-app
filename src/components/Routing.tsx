import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';

import { ROUTES } from 'types';
import { useLimits } from 'hooks/useLimits';
import { useMeta } from 'hooks/useMeta';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { AlertingPage } from 'page/AlertingPage';
import { AlertingWelcomePage } from 'page/AlertingWelcomePage';
import { CheckRouter } from 'page/CheckRouter';
import { ChecksWelcomePage } from 'page/ChecksWelcomePage';
import { ConfigPage } from 'page/ConfigPage';
import { ProbeRouter } from 'page/ProbeRouter';
import { ProbesWelcomePage } from 'page/ProbesWelcomePage';
import { SceneHomepage } from 'page/SceneHomepage';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';

import { getRoute } from './Routing.utils';
import { SceneRedirecter } from './SceneRedirecter';

export const InitialisedRouter = ({ onNavChanged }: Pick<AppRootProps, 'onNavChanged'>) => {
  const queryParams = useQuery();
  const navigate = useNavigation();

  const page = queryParams.get('page');
  useLimits();

  useEffect(() => {
    if (page) {
      queryParams.delete('page');
      const params = queryParams.toString();
      const path = `${page}${params ? '?' : ''}${params}`;
      const translated: QueryParamMap = {};
      queryParams.forEach((value, name) => (translated[name] = value));
      navigate(path, translated);
    }
  }, [page, navigate, queryParams]);

  return (
    <Switch>
      <Route exact path={getRoute(ROUTES.Redirect)}>
        <SceneRedirecter />
      </Route>
      <Route exact path={getRoute(ROUTES.Home)}>
        <SceneHomepage />
      </Route>
      <Route path={getRoute(ROUTES.Scene)}>
        <SceneRedirecter />
      </Route>
      <Route path={getRoute(ROUTES.Checks)}>
        <CheckRouter />
      </Route>
      <Route path={getRoute(ROUTES.Probes)}>
        <ProbeRouter />
      </Route>
      <Route exact path={getRoute(ROUTES.Alerts)}>
        <AlertingPage />
      </Route>
      <Route path={getRoute(ROUTES.Config)}>
        <ConfigPage initialized />
      </Route>

      <Route>
        <Redirect to={getRoute(ROUTES.Home)} />
      </Route>
    </Switch>
  );
};

export const UninitialisedRouter = () => {
  const meta = useMeta();
  const provisioned = Boolean(meta.jsonData?.metrics?.grafanaName);

  // todo: is this the correct check for provisioning?
  // todo: is this state even possible in Grafana v11?
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
      <Route>
        <Redirect to={getRoute(ROUTES.Home)} />
      </Route>
    </Switch>
  );
};
