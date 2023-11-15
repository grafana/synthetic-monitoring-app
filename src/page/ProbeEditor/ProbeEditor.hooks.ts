import { useContext, useEffect } from 'react';
import { useAsyncCallback } from 'react-async-hook';
import { AppEvents } from '@grafana/data';
import appEvents from 'grafana/app/core/app_events';

import { type Probe, ROUTES } from 'types';
import { FaroEvent, reportError, reportEvent } from 'faro';
import { InstanceContext } from 'contexts/InstanceContext';
import { useNavigation } from 'hooks/useNavigation';

type CreateProbeResult = {
  probe: Probe;
  token: string;
};

export function useCreateProbe(probe: Probe, callback: () => void) {
  const { instance } = useContext(InstanceContext);
  const navigate = useNavigation();
  const event = FaroEvent.CREATE_PROBE;

  const { execute, error, loading, result } = useAsyncCallback<CreateProbeResult>(async (formValues: Probe) => {
    const normalizedValues = normalizeProbeValues(formValues);

    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

    const info = await instance.api.addProbe({
      ...probe,
      ...normalizedValues,
      public: false,
    });

    reportEvent(event);
    appEvents.emit(AppEvents.alertSuccess, [`Created probe ${info.name}`]);
    navigate(ROUTES.Probes);
    callback();
    return info;
  });

  useOnError({ event, error, alert: `` });

  return {
    result,
    onSave: execute,
    error,
    loading,
  };
}

type UpdateProbeResult = {
  probe: Probe;
};

export function useUpdateProbe(probe: Probe, callback: () => void) {
  const { instance } = useContext(InstanceContext);
  const navigate = useNavigation();
  const event = FaroEvent.UPDATE_PROBE;

  const { execute, error, loading, result } = useAsyncCallback<UpdateProbeResult>(async (formValues: Probe) => {
    const normalizedValues = normalizeProbeValues(formValues);

    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

    const info = await instance.api.updateProbe({
      ...probe,
      ...normalizedValues,
    });

    reportEvent(event);
    appEvents.emit(AppEvents.alertSuccess, [`Updated probe ${info.probe.name}`]);
    navigate(ROUTES.Probes);
    callback();
    return info;
  });

  useOnError({ event, error });

  return {
    result,
    onUpdate: execute,
    error,
    loading,
  };
}

export function useDeleteProbe(probe: Probe, callback: () => void) {
  const { instance } = useContext(InstanceContext);
  const navigate = useNavigation();
  const event = FaroEvent.DELETE_PROBE;

  const { execute, error, loading, result } = useAsyncCallback(async () => {
    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

    await instance.api.deleteProbe(probe.id!);

    reportEvent(event);
    appEvents.emit(AppEvents.alertSuccess, [`Deleted probe ${probe.name}`]);
    navigate(ROUTES.Probes);
    callback();
  });

  useOnError({ event, error });

  return {
    result,
    onDelete: execute,
    error,
    loading,
  };
}

export function useResetProbeToken(probe: Probe, callback: (token: string) => void) {
  const { instance } = useContext(InstanceContext);
  const event = FaroEvent.RESET_PROBE_TOKEN;

  const { execute, error, loading, result } = useAsyncCallback(async () => {
    if (!instance.api) {
      throw new Error('Not connected to the Synthetic Montoring datasource');
    }

    const { token } = await instance.api.resetProbeToken(probe);

    reportEvent(event);
    callback(token);
  });

  useOnError({ event, error, alert: `Failed to reset probe token` });

  return {
    result,
    onResetToken: execute,
    error,
    loading,
  };
}

// Form values always come back as a string, even for number inputs
function normalizeProbeValues(probe: Probe) {
  return {
    ...probe,
    latitude: Number(probe.latitude),
    longitude: Number(probe.longitude),
  };
}

type useOnErrorProps = {
  event: FaroEvent;
  error?: Error;
  alert?: string;
};

function useOnError({ event, error, alert }: useOnErrorProps) {
  useEffect(() => {
    if (error) {
      reportError(error.message, event);
      alert && appEvents.emit(AppEvents.alertError, [alert]);
    }
  }, [error, event, alert]);
}
