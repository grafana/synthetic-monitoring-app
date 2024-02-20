import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { CheckType, FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { CheckEditor } from 'components/CheckEditor';
import { CheckList } from 'components/CheckList';
import { ChooseCheckType } from 'components/ChooseCheckType';
import { K6CheckCodeEditor } from 'components/K6CheckCodeEditor';
import { MultiHttpSettingsForm } from 'components/MultiHttp/MultiHttpSettingsForm';

import { DashboardPage } from './DashboardPage';

export function CheckRouter() {
  const { isEnabled: perCheckDashboardsEnabled } = useFeatureFlag(FeatureName.PerCheckDashboards);
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={path} exact>
        <CheckList />
      </Route>
      {perCheckDashboardsEnabled && (
        <Route path={`${path}/:id/dashboard`} exact>
          <DashboardPage />
        </Route>
      )}
      <Route path={`${path}/new/:checkType?`}>
        {({ match }) => {
          switch (match?.params.checkType) {
            case CheckType.MULTI_HTTP:
              return <MultiHttpSettingsForm />;
            case CheckType.K6:
              return <K6CheckCodeEditor />;
            default:
              return <CheckEditor />;
          }
        }}
      </Route>
      <Route path={`${path}/edit/:checkType/:id`} exact>
        {({ match }) => {
          switch (match?.params.checkType) {
            case CheckType.MULTI_HTTP:
              return <MultiHttpSettingsForm />;
            case CheckType.K6:
              return <K6CheckCodeEditor />;
            default:
              return <CheckEditor />;
          }
        }}
      </Route>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckType />
      </Route>
    </Switch>
  );
}
