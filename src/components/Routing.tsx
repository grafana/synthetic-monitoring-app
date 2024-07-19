import React, { useEffect } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { config } from '@grafana/runtime';

import { ROUTES } from 'types';
import { useMeta } from 'hooks/useMeta';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { AlertingPage } from 'page/AlertingPage';
import { CheckRouter } from 'page/CheckRouter';
import { ConfigPage } from 'page/ConfigPage';
import { getNavModel } from 'page/pageDefinitions';
import { ProbeRouter } from 'page/ProbeRouter';
import { SceneHomepage } from 'page/SceneHomepage';

import { PLUGIN_URL_PATH } from './Routing.consts';
import { getRoute } from './Routing.utils';
import { SceneRedirecter } from './SceneRedirecter';

export const Routing = ({ onNavChanged }: Pick<AppRootProps, 'onNavChanged'>) => {
  const queryParams = useQuery();
  const navigate = useNavigation();
  const location = useLocation();
  const meta = useMeta();
  const logo = meta.info.logos.large;

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

      {/* Default route (only redirect if the path matches the plugin's URL) */}
      <Route path={PLUGIN_URL_PATH}>
        <Redirect to={getRoute(ROUTES.Home)} />
      </Route>
    </Switch>
  );
};
