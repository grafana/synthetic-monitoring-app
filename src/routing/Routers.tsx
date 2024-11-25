import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';
import { TextLink } from '@grafana/ui';

import { ROUTES } from 'types';
import { LegacyEditRedirect } from 'routing/LegacyEditRedirect';
import { getNewCheckTypeRedirects, getRoute } from 'routing/utils';
import { useCanWriteSM } from 'hooks/useDSPermission';
import { useLimits } from 'hooks/useLimits';
import { useMeta } from 'hooks/useMeta';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { AlertingPage } from 'page/AlertingPage';
import { AlertingWelcomePage } from 'page/AlertingWelcomePage';
import { ChecksWelcomePage } from 'page/ChecksWelcomePage';
import { ConfigPage } from 'page/ConfigPage';
import { DashboardPage } from 'page/DashboardPage';
import { EditCheck } from 'page/EditCheck';
import { EditProbe } from 'page/EditProbe';
import { NewCheck } from 'page/NewCheck';
import { NewProbe } from 'page/NewProbe';
import { CheckNotFound } from 'page/NotFound/CheckNotFound';
import { PluginPageNotFound } from 'page/NotFound/NotFound';
import { Probes } from 'page/Probes';
import { ProbesWelcomePage } from 'page/ProbesWelcomePage';
import { SceneHomepage } from 'page/SceneHomepage';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';

import { CheckList } from '../components/CheckList';
import { ChooseCheckGroup } from '../components/ChooseCheckGroup';
import { SceneRedirecter } from '../components/SceneRedirecter';

export const InitialisedRouter = () => {
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
  const canEdit = useCanWriteSM();

  return (
    <Routes>
      <Route index element={<Navigate to={ROUTES.Home} />} />

      <Route path={ROUTES.Home} element={<SceneHomepage />} />

      <Route path={ROUTES.Checks}>
        <Route index element={<CheckList />} />
        <Route path=":id">
          <Route index element={<DashboardPage />} />
          <Route path="edit" element={canEdit ? <EditCheck /> : <Navigate to=".." replace />} />
          <Route path="dashboard" element={<Navigate to=".." replace />} />
          <Route path="*" element={<CheckNotFound />} />
        </Route>
        <Route path="choose-type" element={<ChooseCheckGroup />} />
        <Route path="new">
          <Route index element={<ChooseCheckGroup />} />
          {getNewCheckTypeRedirects().map(({ checkType, checkTypeGroupUrl }) => (
            <Route key={checkType} path={checkType} element={<Navigate to={`../${checkTypeGroupUrl}`} replace />} />
          ))}
          <Route path=":checkTypeGroup" element={<NewCheck />} />
          <Route path="*" element={<CheckNotFound />} />
        </Route>

        <Route path="edit/:id" element={<LegacyEditRedirect entity="check" />} />

        <Route
          path="*"
          element={
            <PluginPageNotFound>
              The page you are looking for does not exist. Here is a working link to{' '}
              <TextLink href={getRoute(ROUTES.Checks)}>checks listing</TextLink>.
            </PluginPageNotFound>
          }
        />
      </Route>

      <Route path={ROUTES.Probes}>
        <Route index element={<Probes />} />
        <Route path="new" element={<NewProbe />} />
        <Route path=":id">
          <Route index element={<EditProbe forceViewMode />} />
          <Route path="edit" element={<EditProbe />} />
        </Route>

        <Route path="edit/:id" element={<LegacyEditRedirect entity="probe" />} />
      </Route>

      <Route path={ROUTES.Alerts} element={<AlertingPage />} />

      <Route path={ROUTES.Config} element={<ConfigPage initialized />} />

      <Route path={ROUTES.Redirect} element={<SceneRedirecter />} />

      <Route path={ROUTES.Scene} element={<SceneRedirecter />} />

      <Route
        path="*"
        element={
          <PluginPageNotFound>
            The page you are looking for does not exist. Here is a working link to{' '}
            <TextLink href={getRoute(ROUTES.Home)}>home</TextLink>.
          </PluginPageNotFound>
        }
      />
    </Routes>
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
    <Routes>
      <Route path={ROUTES.Home} element={<WelcomePage />} />
      <Route path={ROUTES.Scene} element={<WelcomePage />} />
      <Route path={ROUTES.Checks} element={<ChecksWelcomePage />} />
      <Route path={ROUTES.Probes} element={<ProbesWelcomePage />} />
      <Route path={ROUTES.Alerts} element={<AlertingWelcomePage />} />
      <Route path={ROUTES.Config} element={<ConfigPage />} />

      {/* TODO: Create 404 instead of navigating to home(?) */}
      <Route path="*" element={<Navigate to={ROUTES.Home} />} />
    </Routes>
  );
};
