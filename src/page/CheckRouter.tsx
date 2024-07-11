import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { CheckList } from 'components/CheckList';
import { ChooseCheckGroup } from 'components/ChooseCheckGroup';

import { DashboardPage } from './DashboardPage';
import { EditCheck } from './EditCheck';
import { NewCheck } from './NewCheck';

export function CheckRouter() {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={path} exact>
        <CheckList />
      </Route>
      <Route path={`${path}/:id/dashboard`} exact>
        <DashboardPage />
      </Route>
      <Route path={`${path}/new/:checkTypeGroup?`}>
        <NewCheck />
      </Route>
      <Route path={`${path}/edit/:checkTypeGroup/:id`} exact>
        <EditCheck />
      </Route>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckGroup />
      </Route>
    </Switch>
  );
}
