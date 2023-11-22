import { useContext, useEffect, useMemo, useState } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { AppEvents } from '@grafana/data';
import { type FetchError, isFetchError } from '@grafana/runtime';
import appEvents from 'grafana/app/core/app_events';

import { type Probe } from 'types';
import { FaroEvent, reportError, reportEvent } from 'faro';
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

export type CreateProbeResult = {
  probe: Probe;
  token: string;
};

export function useCreateProbe() {
  const { instance } = useContext(InstanceContext);
  const event = FaroEvent.CREATE_PROBE;

  const { execute, error, loading, result } = useAsyncCallback(
    async (probe: Probe, onSuccess: (res: CreateProbeResult) => void) => {
      if (!instance.api) {
        throw new Error('Not connected to the Synthetic Montoring datasource');
      }

      const info = await instance.api.addProbe({
        ...probe,
        public: false,
      });

      reportEvent(event);
      appEvents.emit(AppEvents.alertSuccess, [`Created probe ${info.probe.name}`]);
      onSuccess(info);
    }
  );

  const err = useOnError({ event, error, alert: `Failed to create probe` });

  return {
    error: err,
    loading,
    onCreate: execute,
    result,
  };
}

export type UpdateProbeResult = {
  probe: Probe;
};

export function useUpdateProbe() {
  const { instance } = useContext(InstanceContext);
  const event = FaroEvent.UPDATE_PROBE;

  const { execute, error, loading, result } = useAsyncCallback(
    async (probe: Probe, onSuccess: (res: UpdateProbeResult) => void) => {
      if (!instance.api) {
        throw new Error('Not connected to the Synthetic Montoring datasource');
      }

      const info = await instance.api.updateProbe(probe);

      reportEvent(event);
      appEvents.emit(AppEvents.alertSuccess, [`Updated probe ${info.probe.name}`]);
      onSuccess(info);
    }
  );

  const err = useOnError({ event, error });

  return {
    result,
    onUpdate: execute,
    error: err,
    loading,
  };
}

export function useDeleteProbe() {
  const { instance } = useContext(InstanceContext);
  const event = FaroEvent.DELETE_PROBE;

  const { execute, error, loading, result } = useAsyncCallback(async (probe: Probe, onSuccess: () => void) => {
    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

    await instance.api.deleteProbe(probe.id!);

    reportEvent(event);
    appEvents.emit(AppEvents.alertSuccess, [`Deleted probe ${probe.name}`]);
    onSuccess();
  });

  const err = useOnError({ event, error, alert: `Failed to delete probe` });

  return {
    error: err,
    loading,
    onDelete: execute,
    result,
  };
}

export function useResetProbeToken(probe: Probe, onSuccess: (token: string) => void) {
  const { instance } = useContext(InstanceContext);
  const event = FaroEvent.RESET_PROBE_TOKEN;

  const { execute, error, loading, result } = useAsyncCallback(async () => {
    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

    const { token } = await instance.api.resetProbeToken(probe);

    reportEvent(event);
    onSuccess(token);
  });

  const err = useOnError({ event, error, alert: `Failed to reset probe token` });

  return {
    error: err,
    loading,
    onResetToken: execute,
    result,
  };
}

type useOnErrorProps = {
  event: FaroEvent;
  error?: Error | FetchError;
  alert?: string;
};

function useOnError({ event, error, alert }: useOnErrorProps) {
  const formattedError = useMemo(() => {
    if (!error) {
      return undefined;
    }

    return isFetchError(error) ? new Error(`${error.data.err} (${error.status})`) : error;
  }, [error]);

  useEffect(() => {
    if (formattedError) {
      reportError(formattedError.message, event);
      alert && appEvents.emit(AppEvents.alertError, [alert]);
    }
  }, [formattedError, event, alert]);

  return formattedError;
}
