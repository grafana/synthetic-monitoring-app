import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { CheckForm } from 'components/CheckForm/CheckForm';
import { CheckList } from 'components/CheckList';
import { ChooseCheckType } from 'components/ChooseCheckType';

import { DashboardPage } from './DashboardPage';

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
      <Route path={`${path}/new/:checkType?`}>
        <CheckForm />
      </Route>
      <Route path={`${path}/edit/:checkType/:id`} exact>
        <CheckForm />
      </Route>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckType />
      </Route>
    </Switch>
  );
}
