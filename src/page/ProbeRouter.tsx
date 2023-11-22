import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { OrgRole } from '@grafana/data';

import { hasRole } from 'utils';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { EditProbe } from 'page/EditProbe';
import { NewProbe } from 'page/NewProbe';
import { Probes } from 'page/Probes';

export const ProbeRouter = () => {
  const { path } = useRouteMatch();
  const isEditor = hasRole(OrgRole.Editor);

  return (
    <SuccessRateContextProvider onlyProbes>
      <Switch>
        <Route path={path} exact>
          <Probes />
        </Route>
        {isEditor && (
          <Route path={`${path}/new`}>
            <NewProbe />
          </Route>
        )}
        <Route path={`${path}/edit/:id`}>
          <EditProbe />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
};
