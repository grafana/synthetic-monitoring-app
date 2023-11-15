import React, { useContext } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { useProbes } from 'data/useProbes';

import { InstanceContext } from 'contexts/InstanceContext';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { ProbeEditor } from 'page/ProbeEditor';
import { Probes } from 'page/Probes';

export const ProbeRouter = () => {
  const { loading: instanceLoading } = useContext(InstanceContext);
  const { path } = useRouteMatch();
  const { error, loading, probes, refetchProbes } = useProbes();

  const props = {
    probes,
    loading: loading || instanceLoading,
    error,
    refetchProbes,
  };

  return (
    <SuccessRateContextProvider probes={probes}>
      <Switch>
        <Route path={path} exact>
          <Probes {...props} />
        </Route>
        <Route path={`${path}/new`}>
          <ProbeEditor {...props} isNew />
        </Route>
        <Route path={`${path}/edit/:id`}>
          <ProbeEditor {...props} />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
};
