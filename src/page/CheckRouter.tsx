import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { FeatureName } from 'types';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { CheckEditor } from 'components/CheckForm/CheckEditor';
import { CheckList } from 'components/CheckList';
import { ChooseCheckType } from 'components/ChooseCheckType';

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
        <CheckEditor />
      </Route>
      <Route path={`${path}/edit/:checkType/:id`} exact>
        <CheckEditor />
      </Route>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckType />
      </Route>
    </Switch>
  );
}
