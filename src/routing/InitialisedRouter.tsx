import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';
import { TextLink } from '@grafana/ui';

import { FeatureName } from 'types';
import { LegacyEditRedirect } from 'routing/LegacyEditRedirect';
import { AppRoutes } from 'routing/types';
import { getNewCheckTypeRedirects, getRoute } from 'routing/utils';
import { getUserPermissions } from 'data/permissions';
import { useFeatureFlagContext } from 'hooks/useFeatureFlagContext';
import { useLimits } from 'hooks/useLimits';
import { QueryParamMap, useNavigation } from 'hooks/useNavigation';
import { useURLSearchParams } from 'hooks/useURLSearchParams';
import { SceneRedirecter } from 'components/SceneRedirecter';
import { AlertingPage } from 'page/AlertingPage';
import { CheckList } from 'page/CheckList';
import { ChooseCheckGroup } from 'page/ChooseCheckGroup';
import { ConfigPageLayout } from 'page/ConfigPageLayout';
import { AccessTokensTab } from 'page/ConfigPageLayout/tabs/AccessTokensTab';
import { GeneralTab } from 'page/ConfigPageLayout/tabs/GeneralTab';
import { SecretsManagementTab } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
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



export const InitialisedRouter = () => {
  const urlSearchParams = useURLSearchParams();
  const navigate = useNavigation();
  const { isFeatureEnabled } = useFeatureFlagContext();

  const page = urlSearchParams.get('page');
  useLimits();

  useEffect(() => {
    if (page) {
      urlSearchParams.delete('page');
      const params = urlSearchParams.toString();
      const path = `${page}${params ? '?' : ''}${params}`;
      const translated: QueryParamMap = {};
      urlSearchParams.forEach((value, name) => (translated[name] = value));
      navigate(path, translated);
    }
  }, [page, navigate, urlSearchParams]);

  const { canWriteChecks, canReadChecks, canReadProbes } = getUserPermissions();

  return (
    <Routes>
      <Route index element={<Navigate to={AppRoutes.Home} />} />

      <Route
        path={AppRoutes.Home}
        element={
          canReadChecks ? (
            <SceneHomepage />
          ) : (
            <UnauthorizedPage permissions={['grafana-synthetic-monitoring-app.checks:read']} />
          )
        }
      />

      <Route path={AppRoutes.Checks}>
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
              <TextLink href={getRoute(AppRoutes.Checks)}>checks listing</TextLink>.
            </PluginPageNotFound>
          }
        />
      </Route>

      <Route path={AppRoutes.Probes}>
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

      <Route path={AppRoutes.Alerts} element={<AlertingPage />} />

      <Route path={`${AppRoutes.Config}`} Component={ConfigPageLayout}>
        <Route index element={<GeneralTab />} />
        <Route path="access-tokens" element={<AccessTokensTab />} />
        <Route path="terraform" element={<TerraformTab />} />
        {isFeatureEnabled(FeatureName.SecretsManagement) && <Route path="secrets" element={<SecretsManagementTab />} />}
      </Route>

      <Route path={AppRoutes.Redirect} element={<SceneRedirecter />} />

      <Route path={AppRoutes.Scene} element={<SceneRedirecter />} />

      <Route
        path="*"
        element={
          <PluginPageNotFound>
            The page you are looking for does not exist. Here is a working link to{' '}
            <TextLink href={getRoute(AppRoutes.Home)}>home</TextLink>.
          </PluginPageNotFound>
        }
      />
    </Routes>
  );
};
