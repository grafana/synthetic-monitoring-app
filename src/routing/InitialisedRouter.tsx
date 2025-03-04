import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';
import { TextLink } from '@grafana/ui';

import { LegacyEditRedirect } from 'routing/LegacyEditRedirect';
import { ROUTES } from 'routing/types';
import { getNewCheckTypeRedirects, getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useLimits } from 'hooks/useLimits';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useQuery } from 'hooks/useQuery';
import { SceneRedirecter } from 'components/SceneRedirecter';
import { AlertingPage } from 'page/AlertingPage';
import { CheckList } from 'page/CheckList';
import { ChooseCheckGroup } from 'page/ChooseCheckGroup';
import { ConfigPageLayout } from 'page/ConfigPageLayout';
import { AccessTokensTab } from 'page/ConfigPageLayout/tabs/AccessTokensTab';
import { GeneralTab } from 'page/ConfigPageLayout/tabs/GeneralTab';
import { TerraformTab } from 'page/ConfigPageLayout/tabs/TerraformTab';
import { DashboardPage } from 'page/DashboardPage';
import { EditCheck } from 'page/EditCheck';
import { EditProbe } from 'page/EditProbe';
import { NewCheck } from 'page/NewCheck';
import { NewProbe } from 'page/NewProbe';
import { CheckNotFound } from 'page/NotFound/CheckNotFound';
import { PluginPageNotFound } from 'page/NotFound/NotFound';
import { Probes } from 'page/Probes';
import { SceneHomepage } from 'page/SceneHomepage';
import { UnauthorizedPage } from 'page/UnauthorizedPage';

import { ChecksterRoutes } from '../components/ChecksterPro/ChecksterRoutes';

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

  const { canWriteChecks, canReadChecks, canReadProbes } = getUserPermissions();

  return (
    <Routes>
      <Route index element={<Navigate to={ROUTES.Home} />} />

      <Route
        path={ROUTES.Home}
        element={
          canReadChecks ? (
            <SceneHomepage />
          ) : (
            <UnauthorizedPage permissions={['grafana-synthetic-monitoring-app.checks:read']} />
          )
        }
      />

      <Route path={ROUTES.Checks}>
        <Route index element={<CheckList />} />
        <Route path=":id">
          <Route
            index
            element={
              canReadChecks ? (
                <DashboardPage />
              ) : (
                <UnauthorizedPage permissions={['grafana-synthetic-monitoring-app.checks:read']} />
              )
            }
          />
          <Route path="edit" element={canWriteChecks ? <EditCheck /> : <Navigate to=".." replace />} />
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
          <Route
            index
            element={
              canReadProbes ? (
                <EditProbe forceViewMode />
              ) : (
                <UnauthorizedPage permissions={['grafana-synthetic-monitoring-app.probes:read']} />
              )
            }
          />
          <Route path="edit" element={<EditProbe />} />
        </Route>

        <Route path="edit/:id" element={<LegacyEditRedirect entity="probe" />} />
      </Route>

      <Route path={ROUTES.Alerts} element={<AlertingPage />} />

      <Route path={`${ROUTES.Config}`} Component={ConfigPageLayout}>
        <Route index element={<GeneralTab />} />
        <Route path="access-tokens" element={<AccessTokensTab />} />
        <Route path="terraform" element={<TerraformTab />} />
      </Route>

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

      <Route path={`${ROUTES.Checkster}/*`} element={<ChecksterRoutes />} />
    </Routes>
  );
};
