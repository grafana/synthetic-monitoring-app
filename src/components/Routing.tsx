import React, { useContext, useEffect, useLayoutEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { config } from '@grafana/runtime';

import { ROUTES } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { AlertingPage } from 'page/AlertingPage';
import { AlertingWelcomePage } from 'page/AlertingWelcomePage';
import { CheckRouter } from 'page/CheckRouter';
import { ChecksWelcomePage } from 'page/ChecksWelcomePage';
import { ConfigPage } from 'page/ConfigPage';
import { getNavModel } from 'page/pageDefinitions';
import { ProbeRouter } from 'page/ProbeRouter';
import { ProbesWelcomePage } from 'page/ProbesWelcomePage';
import { SceneHomepage } from 'page/SceneHomepage';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';

import { PLUGIN_URL_PATH } from './Routing.consts';
import { getRoute } from './Routing.utils';
import { SceneRedirecter } from './SceneRedirecter';

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
    if (!provisioned) {
      navigate(ROUTES.Home);
    }
  }, [provisioned, navigate]);

  if (!provisioned) {
    return <UnprovisionedSetup />;
  }

  return (
    <Switch>
      <Route exact path={getRoute(ROUTES.Redirect)}>
        <SceneRedirecter />
      </Route>
      <Route exact path={getRoute(ROUTES.Home)}>
        {initialized ? <SceneHomepage /> : <WelcomePage />}
      </Route>
      <Route path={getRoute(ROUTES.Scene)}>{initialized ? <SceneRedirecter /> : <WelcomePage />}</Route>
      <Route path={getRoute(ROUTES.Checks)}>{initialized ? <CheckRouter /> : <ChecksWelcomePage />}</Route>
      <Route path={getRoute(ROUTES.Probes)}>{initialized ? <ProbeRouter /> : <ProbesWelcomePage />}</Route>
      <Route exact path={getRoute(ROUTES.Alerts)}>
        {initialized ? <AlertingPage /> : <AlertingWelcomePage />}
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
