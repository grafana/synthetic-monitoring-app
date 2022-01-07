import { ChecksPage } from 'page/ChecksPage';
import HomePage from 'page/HomePage';
import { ProbesPage } from 'page/ProbesPage';
import React, { useEffect, useContext } from 'react';
import { BrowserRouter, Redirect, Route, Switch, useHistory, useLocation, useParams } from 'react-router-dom';
import { Alerting } from 'components/Alerting';
import { AppRootProps } from '@grafana/data';
import { getNavModel } from 'page/pageDefinitions';
import { PLUGIN_URL_PATH } from './constants';
import { InstanceContext } from 'contexts/InstanceContext';
import { getLocationSrv } from '@grafana/runtime';
import { WelcomePage } from 'page/WelcomePage';

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function useNavigation() {
  const history = useHistory();
  const navigate = (url: string, external?: boolean) => {
    const normalized = url.startsWith('/') ? url.slice(1) : url;
    if (external) {
      getLocationSrv().update({ partial: false, path: `/${normalized}` });
    } else {
      history.push(`${PLUGIN_URL_PATH}${normalized}`);
    }
  };
  return navigate;
}

function DashboardManager() {
  const { instance } = useContext(InstanceContext);
  const nav = useNavigation();
  const queryParams = useQuery();
  const dashboard = queryParams.get('dashboard');
  const dashboards = instance.api?.instanceSettings?.jsonData.dashboards;
  console.log('in dashboard manager', { dashboard }, dashboards);
  if (!dashboard || !dashboards) {
    return null;
  }

  const targetDashboard =
    dashboards?.find((dashboardJson) => dashboardJson.json.indexOf(dashboard) > -1) ?? dashboards[0];

  console.log({ targetDashboard });
  if (targetDashboard) {
    nav(`/d/${targetDashboard.uid}`, true);
    return null;
  }

  nav('home');
  return null;
}

export const Routing = ({ onNavChanged, meta, ...rest }: AppRootProps) => {
  const queryParams = useQuery();
  const navigate = useNavigation();
  const location = useLocation();
  console.log(queryParams);

  useEffect(() => {
    const navModel = getNavModel(meta.info.logos.large, location.pathname);
    onNavChanged(navModel);
  }, [meta.info.logos.large, onNavChanged, location.pathname]);

  const page = queryParams.get('page');
  if (page) {
    queryParams.delete('page');
    const params = queryParams.toString();
    const path = `${page}${params ? '?' : ''}${params}`;
    navigate(path);
  }

  console.log({ location, url: `${PLUGIN_URL_PATH}probes` });
  return (
    <div>
      <Switch>
        <Route exact path={`${PLUGIN_URL_PATH}redirect`}>
          <DashboardManager />
        </Route>
        <Route exact path="/">
          <Redirect to={`${PLUGIN_URL_PATH}home`} />
        </Route>
        <Route path={`${PLUGIN_URL_PATH}setup`}>
          <WelcomePage />
        </Route>
        <Route exact path={`${PLUGIN_URL_PATH}home`}>
          <HomePage />
        </Route>
        <Route path={`${PLUGIN_URL_PATH}probes`}>
          <ProbesPage />
        </Route>
        <Route exact path={`${PLUGIN_URL_PATH}alerts`}>
          <Alerting />
        </Route>
        <Route exact path={`${PLUGIN_URL_PATH}checks`}>
          <ChecksPage />
        </Route>
      </Switch>
    </div>
  );
};
