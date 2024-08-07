import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { CheckType } from 'types';
import { CHECK_TYPE_OPTIONS } from 'hooks/useCheckTypeOptions';
import { useCanWriteSM } from 'hooks/useDSPermission';
import { CheckList } from 'components/CheckList';
import { ChooseCheckGroup } from 'components/ChooseCheckGroup';

import { DashboardPage } from './DashboardPage';
import { EditCheck } from './EditCheck';
import { NewCheck } from './NewCheck';

export function CheckRouter() {
  const { path } = useRouteMatch();
  const canEdit = useCanWriteSM();

  return (
    <Switch>
      {NEW_CHECK_REDIRECTS.map(({ from, to }) => (
        <Route key={from} path={`${path}${from}`} exact>
          <Redirect to={`${path}${to}`} />
        </Route>
      ))}
      {EDIT_CHECK_REDIRECTS.map(({ from, to }) => (
        <Route key={from} path={`${path}${from}`} exact>
          {(props) => {
            return <Redirect to={`${path}${to}/${props.match?.params.id}`} />;
          }}
        </Route>
      ))}
      <Route path={`${path}/edit/`} exact>
        <CheckList />
      </Route>
      <Route path={path} exact>
        <CheckList />
      </Route>
      <Route path={`${path}/:id/dashboard`} exact>
        <DashboardPage />
      </Route>
      <Route path={`${path}/new/:checkTypeGroup`}>
        <NewCheck />
      </Route>
      <Route path={`${path}/edit/:checkTypeGroup/:id`} exact>
        {canEdit ? <EditCheck /> : <Redirect to={`${path}`} />}
      </Route>
      <Route path={`${path}/choose-type`} exact>
        <ChooseCheckGroup />
      </Route>
    </Switch>
  );
}

// these result in the same from/to values so redirect infinitely
const excludedCheckTypes = [CheckType.Scripted, CheckType.Browser];
const filteredCheckTypes = CHECK_TYPE_OPTIONS.filter(({ value }) => !excludedCheckTypes.includes(value));

const NEW_CHECK_REDIRECTS = filteredCheckTypes.map(({ group, value }) => ({
  from: `/new/${value}`,
  to: `/new/${group}?checkType=${value}`,
}));

const EDIT_CHECK_REDIRECTS = filteredCheckTypes.map(({ group, value }) => ({
  from: `/edit/${value}/:id`,
  to: `/edit/${group}`,
}));
