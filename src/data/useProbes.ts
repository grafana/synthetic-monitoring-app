import { useContext, useEffect, useState } from 'react';

import { type Probe } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { useTrigger } from 'hooks/useTrigger';

export function useProbes() {
  const [probesLoading, setProbesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [probes, setProbes] = useState<Probe[]>([]);
  const { instance, loading } = useContext(InstanceContext);
  const [trigger, refetchProbes] = useTrigger();

  useEffect(() => {
    const fetchProbes = async () => {
      if (instance.api) {
        try {
          setProbesLoading(true);
          const probes = await instance.api?.listProbes();
          setProbes(probes);
          setProbesLoading(false);
          setError(null);
        } catch (e) {
          if (e instanceof Error) {
            return setError(e.message);
          }

          if (typeof e === 'string') {
            setError(e);
          }
        }
      }
    };

    fetchProbes();
  }, [loading, instance.api, trigger]);

  return {
    error,
    loading: probesLoading || loading,
    probes,
    refetchProbes,
  };
}
