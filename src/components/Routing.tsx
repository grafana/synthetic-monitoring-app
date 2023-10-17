import React, { useLayoutEffect, useEffect, useContext } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { config } from '@grafana/runtime';

import { PLUGIN_URL_PATH } from './constants';
import { ROUTES } from 'types';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { AlertingPage } from 'page/AlertingPage';
import { CheckRouter } from 'page/CheckRouter';
import { ConfigPage } from 'page/ConfigPage';
import { DashboardPage } from 'page/DashboardPage';
import { getNavModel } from 'page/pageDefinitions';
import { InstanceContext } from 'contexts/InstanceContext';
import { ProbeRouter } from 'page/ProbeRouter';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';
import { HomePage } from 'page/HomePage';
import { DashboardRedirecter } from './DashboardRedirecter';

export const Routing = ({ onNavChanged }: Pick<AppRootProps, 'onNavChanged'>) => {
  const queryParams = useQuery();
  const navigate = useNavigation();
  const location = useLocation();
  const { instance, meta } = useContext(InstanceContext);
  const provisioned = Boolean(meta?.jsonData?.metrics?.grafanaName);
  const initialized = meta?.enabled && instance.api;
  const logo = meta?.info.logos.large || ``;

  useEffect(() => {
    const navModel = getNavModel(logo, location.pathname);
    if (!config.featureToggles.topnav) {
      onNavChanged(navModel);
    }
  }, [logo, onNavChanged, location.pathname]);

  const page = queryParams.get('page');
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

  useLayoutEffect(() => {
    if (!provisioned || (!initialized && location.pathname !== getRoute(ROUTES.Home))) {
      navigate(ROUTES.Home);
    }
  }, [provisioned, initialized, location.pathname, navigate]);

  if (!provisioned) {
    return <UnprovisionedSetup />;
  }

  if (!initialized) {
    return <WelcomePage />;
  }

  return (
    <Switch>
      <Route exact path={getRoute(ROUTES.Redirect)}>
        <DashboardRedirecter />
      </Route>
      <Route exact path={getRoute(ROUTES.Home)}>
        <HomePage />
      </Route>
      <Route path={getRoute(ROUTES.Scene)}>
        <DashboardPage />
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
        <ConfigPage />
      </Route>

      {/* Default route (only redirect if the path matches the plugin's URL) */}
      <Route path={PLUGIN_URL_PATH}>
        <Redirect to={getRoute(ROUTES.Home)} />
      </Route>
    </Switch>
  );
};

export function getRoute(route: ROUTES) {
  return `${PLUGIN_URL_PATH}${route}`;
}
