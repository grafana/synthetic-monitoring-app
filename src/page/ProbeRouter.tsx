import React, { useContext } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { OrgRole } from '@grafana/data';

import { hasRole } from 'utils';
import { InstanceContext } from 'contexts/InstanceContext';
import { useProbes } from 'data/useProbes';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { EditProbe } from 'page/EditProbe';
import { NewProbe } from 'page/NewProbe';
import { Probes } from 'page/Probes';

export const ProbeRouter = () => {
  const { loading: instanceLoading } = useContext(InstanceContext);
  const { path } = useRouteMatch();
  const { error, loading, probes, refetchProbes } = useProbes();
  const isEditor = hasRole(OrgRole.Editor);

  const props = {
    probes,
    loading: loading || instanceLoading,
    error,
    refetchProbes,
  };

  return (
    <SuccessRateContextProvider onlyProbes probes={probes}>
      <Switch>
        <Route path={path} exact>
          <Probes {...props} />
        </Route>
        {isEditor && (
          <Route path={`${path}/new`}>
            <NewProbe {...props} />
          </Route>
        )}
        <Route path={`${path}/edit/:id`}>
          <EditProbe {...props} />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
};
