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
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { DashboardRedirecter } from './DashboardRedirecter';
import { ROUTES } from 'types';
import { config, PluginPage } from '@grafana/runtime';

export const Routing = ({ onNavChanged, meta, ...rest }: AppRootProps) => {
  const queryParams = useQuery();
  const navigate = useNavigation();
  const location = useLocation();
  const { instance, provisioned } = useContext(InstanceContext);
  const initialized = meta.enabled && instance.api;

  useEffect(() => {
    const navModel = getNavModel(meta.info.logos.large, location.pathname);
    if (!config.featureToggles.topnav) {
      console.log('on nav changing');
      onNavChanged(navModel);
    }
  }, [meta.info.logos.large, onNavChanged, location.pathname]);

  useEffect(() => {
    // not provisioned and not initialized
    if (
      meta.enabled &&
      (!instance.metrics || !instance.logs) &&
      !provisioned &&
      !location.pathname.includes('unprovisioned')
    ) {
      navigate(ROUTES.Unprovisioned);
    }
    // not provisioned and just initialized
    if (meta.enabled && instance.metrics && instance.logs && location.pathname.includes('unprovisioned')) {
      navigate(ROUTES.Home);
    }
    // Provisioned but not initialized
    if (meta.enabled && !instance.api && provisioned && !location.pathname.includes('setup')) {
      navigate(ROUTES.Setup);
    }
  }, [meta.enabled, instance.metrics, instance.logs, location.pathname, navigate, instance.api, provisioned]);

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
          <PluginPage>
            <Alerting />
          </PluginPage>
        </Route>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}`}>
          <CheckRouter />
        </Route>

        {/* Default route (only redirect if the path matches the plugin's URL) */}
        <Route path={PLUGIN_URL_PATH}>
          <Redirect to={`${PLUGIN_URL_PATH}${ROUTES.Home}`} />
        </Route>
      </Switch>
    </div>
  );
};
