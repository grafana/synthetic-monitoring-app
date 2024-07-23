import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { useCanWriteSM } from 'hooks/useDSPermission';
import { EditProbe } from 'page/EditProbe';
import { NewProbe } from 'page/NewProbe';
import { Probes } from 'page/Probes';

export const ProbeRouter = () => {
  const { path } = useRouteMatch();
  const canEdit = useCanWriteSM();

  return (
    <Switch>
      <Route path={path} exact>
        <Probes />
      </Route>
      {canEdit && (
        <Route path={`${path}/new`}>
          <NewProbe />
        </Route>
      )}
      <Route path={`${path}/edit/:id`}>
        <EditProbe />
      </Route>
    </Switch>
  );
};
