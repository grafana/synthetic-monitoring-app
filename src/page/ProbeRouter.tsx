import React, { useContext, useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { Probe } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import ProbeEditor from 'components/ProbeEditor/ProbeEditor';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { Probes } from 'page/Probes';

export const ProbeRouter = () => {
  const [probesLoading, setProbesLoading] = useState(true);
  const [probes, setProbes] = useState<Probe[]>([]);
  const { instance, loading: instanceLoading } = useContext(InstanceContext);
  const { path } = useRouteMatch();

  useEffect(() => {
    const fetchProbes = async () => {
      const probes = await instance.api?.listProbes();
      if (probes) {
        setProbes(probes);
        setProbesLoading(false);
      }
    };
    fetchProbes();
  }, [instanceLoading, instance.api]);

  if (probesLoading || instanceLoading) {
    return <div>Loading...</div>;
  }

  return (
    <SuccessRateContextProvider probes={probes}>
      <Switch>
        <Route path={path} exact>
          <Probes probes={probes} />
        </Route>
        <Route path={`${path}/new`}>
          <ProbeEditor probes={probes} />
        </Route>
        <Route path={`${path}/edit/:id`}>
          <ProbeEditor probes={probes} />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
};
