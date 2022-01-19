// Libraries
import React, { useContext, useState, useEffect, useCallback } from 'react';

// Types
import { Probe, ProbePageParams, ROUTES } from 'types';
import ProbeEditor from 'components/ProbeEditor';
import { InstanceContext } from 'contexts/InstanceContext';
import { ProbeList } from 'components/ProbeList';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';
import { trackEvent } from 'analytics';
import { useParams } from 'react-router-dom';
import { useNavigation } from 'hooks/useNavigation';

const TEMPLATE_PROBE = {
  name: '',
  public: false,
  latitude: 0.0,
  longitude: 0.0,
  region: '',
  labels: [],
  online: false,
  onlineChange: 0,
  version: 'unknown',
  deprecated: false,
} as Probe;

export const ProbesPage = () => {
  const [probesLoading, setProbesLoading] = useState(true);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [selectedProbe, setSelectedProbe] = useState<Probe | undefined>();
  const { instance, loading: instanceLoading } = useContext(InstanceContext);
  const { view, id } = useParams<ProbePageParams>();
  const navigate = useNavigation();

  const findSelectedProbe = useCallback(() => {
    if (id && probes) {
      const idInt = parseInt(id, 10);
      return probes.find((probe) => probe.id === idInt);
    }
    return;
  }, [id, probes]);

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

  useEffect(() => {
    const selected = findSelectedProbe();
    setSelectedProbe(selected);
  }, [id, findSelectedProbe]);

  const onGoBack = () => {
    setSelectedProbe(undefined);
    navigate(ROUTES.Probes);
  };

  const onSelectProbe = (id: number) => {
    navigate(`${ROUTES.EditProbe}/${id}`);
  };

  const getView = () => {
    switch (view) {
      case 'new':
        return <ProbeEditor probe={TEMPLATE_PROBE} onReturn={onGoBack} />;
      case 'edit': {
        if (selectedProbe) {
          return <ProbeEditor probe={selectedProbe} onReturn={onGoBack} />;
        }
        return null;
      }
      default:
        return (
          <ProbeList
            probes={probes}
            onAddNew={() => {
              trackEvent('viewAddProbe');
              navigate(ROUTES.NewProbe);
            }}
            onSelectProbe={onSelectProbe}
          />
        );
    }
  };

  if (probesLoading || instanceLoading) {
    return <div>Loading...</div>;
  }

  return <SuccessRateContextProvider probes={probes}>{getView()}</SuccessRateContextProvider>;
};
