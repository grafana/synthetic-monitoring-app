import { CheckRouter } from 'page/CheckRouter';
import HomePage from 'page/HomePage';
import { ProbeRouter } from 'page/ProbeRouter';
import React, { useEffect, useContext } from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { Alerting } from 'components/Alerting';
import { AppRootProps } from '@grafana/data';
import { getNavModel } from 'page/pageDefinitions';
import { PLUGIN_URL_PATH } from './constants';
import { InstanceContext } from 'contexts/InstanceContext';
import { WelcomePage } from 'page/WelcomePage';
import { UnprovisionedSetup } from './UnprovisionedSetup';
import { useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { DashboardRedirecter } from './DashboardRedirecter';
import { ROUTES } from 'types';

export const Routing = ({ onNavChanged, meta, ...rest }: AppRootProps) => {
  const queryParams = useQuery();
  const navigate = useNavigation();
  const location = useLocation();
  const { instance } = useContext(InstanceContext);
  const initialized = meta.enabled && instance.api;

  useEffect(() => {
    const navModel = getNavModel(meta.info.logos.large, location.pathname);
    onNavChanged(navModel);
  }, [meta.info.logos.large, onNavChanged, location.pathname]);

  useEffect(() => {
    if (meta.enabled && (!instance.metrics || !instance.logs) && !location.pathname.includes('unprovisioned')) {
      navigate(ROUTES.Unprovisioned);
    }
    if (meta.enabled && instance.metrics && instance.logs && location.pathname.includes('unprovisioned')) {
      navigate(ROUTES.Home);
    }
    if (meta.enabled && !instance.api && !location.pathname.includes('setup')) {
      navigate(ROUTES.Setup);
    }
  }, [meta.enabled, instance.metrics, instance.logs, location.pathname, navigate, instance.api]);

  const page = queryParams.get('page');
  if (page) {
    queryParams.delete('page');
    const params = queryParams.toString();
    const path = `${page}${params ? '?' : ''}${params}`;
    navigate(path);
  }

  return (
    <div>
      <Switch>
        <Route exact path={`${PLUGIN_URL_PATH}${ROUTES.Redirect}`}>
          <DashboardRedirecter />
        </Route>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Setup}`}>
          {initialized ? <Redirect to={`${PLUGIN_URL_PATH}${ROUTES.Home}`} /> : <WelcomePage />}
        </Route>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Unprovisioned}`}>
          <UnprovisionedSetup pluginId={meta.id} pluginName={meta.name} />
        </Route>
        <Route exact path={`${PLUGIN_URL_PATH}${ROUTES.Home}`}>
          <HomePage />
        </Route>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Probes}`}>
          <ProbeRouter />
        </Route>
        <Route exact path={`${PLUGIN_URL_PATH}${ROUTES.Alerts}`}>
          <Alerting />
        </Route>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}`}>
          <CheckRouter />
        </Route>
        <Route exact path="*">
          <Redirect to={`${PLUGIN_URL_PATH}${ROUTES.Home}`} />
        </Route>
      </Switch>
    </div>
  );
};
