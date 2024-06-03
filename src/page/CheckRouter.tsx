import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { CheckForm2 } from 'components/CheckForm2/CheckForm2';
import { CheckList } from 'components/CheckList';
import { ChooseCheckGroup } from 'components/ChooseCheckGroup';

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
      <Route path={`${path}/new/:checkTypeGroup?`}>
        <CheckForm2 />
      </Route>
      <Route path={`${path}/edit/:checkTypeGroup/:id`} exact>
        <CheckForm2 />
      </Route>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckGroup />
      </Route>
    </Switch>
  );
}
