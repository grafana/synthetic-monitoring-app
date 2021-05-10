// Libraries
import React, { useContext, useState, useEffect } from 'react';

// Types
import { Probe } from 'types';
import { getLocationSrv } from '@grafana/runtime';
import ProbeEditor from 'components/ProbeEditor';
import { InstanceContext } from 'contexts/InstanceContext';
import { ProbeList } from 'components/ProbeList';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

interface Props {
  id?: string;
}

export const ProbesPage = ({ id }: Props) => {
  const [isAddingNew, setAddingNew] = useState(false);
  const [probesLoading, setProbesLoading] = useState(true);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [selectedProbe, setSelectedProbe] = useState<Probe | undefined>();
  const { instance, loading: instanceLoading } = useContext(InstanceContext);
  const api = instance.api ?? undefined;
  useEffect(() => {
    const fetchProbes = async () => {
      const probes = await api?.listProbes();
      if (probes) {
        setProbes(probes);
        setProbesLoading(false);
      }
      if (id) {
        const selectedProbe = probes?.find((probe) => probe.id === parseInt(id, 10));
        setSelectedProbe(selectedProbe);
      }
    };
    fetchProbes();
  }, [instanceLoading, api, id]);

  const onGoBack = () => {
    setSelectedProbe(undefined);
    setAddingNew(false);
    getLocationSrv().update({
      partial: true,
      query: {
        id: '',
      },
    });
  };

  const onSelectProbe = (id: number) => {
    getLocationSrv().update({
      partial: true,
      query: {
        id,
      },
    });
  };

  if (probesLoading || instanceLoading) {
    return <div>Loading...</div>;
  }

  if (selectedProbe) {
    return <ProbeEditor probe={selectedProbe} onReturn={onGoBack} />;
  }

  if (isAddingNew) {
    const template = {
      name: '',
      public: false,
      latitude: 0.0,
      longitude: 0.0,
      region: '',
      labels: [],
      online: false,
      onlineChange: 0,
      version: 'unknown',
    } as Probe;
    return <ProbeEditor probe={template} onReturn={onGoBack} />;
  }
  return (
    <SuccessRateContextProvider probes={probes}>
      <ProbeList probes={probes} onAddNew={() => setAddingNew(true)} onSelectProbe={onSelectProbe} />
    </SuccessRateContextProvider>
  );
};
