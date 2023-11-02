// Libraries
import React, { useContext, useEffect,useState } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

// Types
import { Probe, ROUTES } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';
import ProbeEditor from 'components/ProbeEditor/ProbeEditor';
import { ProbeList } from 'components/ProbeList';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

export const ProbeRouter = () => {
  const [probesLoading, setProbesLoading] = useState(true);
  const [probes, setProbes] = useState<Probe[]>([]);
  const { instance, loading: instanceLoading } = useContext(InstanceContext);
  const navigate = useNavigation();
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

  const onGoBack = () => {
    navigate(ROUTES.Probes);
  };

  const onSelectProbe = (id: number) => {
    navigate(`${ROUTES.EditProbe}/${id}`);
  };

  if (probesLoading || instanceLoading) {
    return <div>Loading...</div>;
  }

  return (
    <SuccessRateContextProvider probes={probes}>
      <Switch>
        <Route path={path} exact>
          <ProbeList
            probes={probes}
            onAddNew={() => {
              navigate(ROUTES.NewProbe);
            }}
            onSelectProbe={onSelectProbe}
          />
        </Route>
        <Route path={`${path}/new`}>
          <ProbeEditor probes={probes} onReturn={onGoBack} />
        </Route>
        <Route path={`${path}/edit/:id`}>
          <ProbeEditor probes={probes} onReturn={onGoBack} />
        </Route>
      </Switch>
    </SuccessRateContextProvider>
  );
};
