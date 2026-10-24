import { useEffect, useMemo, useState } from 'react';
import { dateTime } from '@grafana/data';

import { AdHocCheckState, ProbeStateStatus } from './types.adhoc-check';
import type { AdHocCheckResponse } from 'datasource/responses.types';
import { useProbes } from 'data/useProbes';
import { useCanReadLogs } from 'hooks/useDSPermission';

import { DEFAULT_GC_INTERVAL_IN_MILLISECONDS, DEFAULT_TIMEOUT_IN_SECONDS } from './constants';
import { useAdHocLogs } from './useAdHocLogs';

type AdHocCheckStateMap = Record<AdHocCheckState['id'], AdHocCheckState>;

function createProbeState(id: number, name: string, isPublic: boolean, state = ProbeStateStatus.Pending) {
  return {
    id,
    name,
    state,
    public: isPublic,
    logs: [],
    timeseries: [],
  };
}

/**
 * Tracks the results of every ad hoc check run requested so far: per-probe state, the logs that
 * arrive for pending runs and the timeout of runs whose logs never show up.
 */
export function useAdHocResults(newHocCheckRequest?: AdHocCheckResponse) {
  const canReadLogs = useCanReadLogs();
  const [logState, setLogState] = useState<AdHocCheckStateMap>({});
  const { data: probes, isLoading: isLoadingProbes } = useProbes(); // This will also make the execution step work, fix so that it always works
  const items = useMemo(() => {
    return Object.values(logState);
  }, [logState]);

  const pendingIds = items.reduce<string[]>((acc, { id, probeState }) => {
    if (Object.values(probeState).some(({ state }) => state === ProbeStateStatus.Pending)) {
      acc.push(id);
    }

    return acc;
  }, []);
  const expr = pendingIds.length && canReadLogs ? `{type="adhoc"} |~"${pendingIds.join('|')}" | json` : undefined;

  useEffect(() => {
    if (pendingIds.length) {
      const interval = setInterval(() => {
        const now = dateTime();
        setLogState((prevState) => {
          return pendingIds.reduce<AdHocCheckStateMap>((acc, id) => {
            if (
              acc[id] &&
              now.diff(acc[id].created, 'seconds') > DEFAULT_TIMEOUT_IN_SECONDS + acc[id].checkTimeoutInSeconds
            ) {
              return {
                ...acc,
                [id]: {
                  ...acc[id],
                  probeState: Object.values(acc[id].probeState).reduce((acc2, state) => {
                    if (state.state !== ProbeStateStatus.Pending) {
                      return acc2;
                    }
                    return {
                      ...acc2,
                      [state.name]: {
                        ...state,
                        state: ProbeStateStatus.Timeout,
                      },
                    };
                  }, acc[id].probeState),
                },
              };
            }

            return acc;
          }, prevState);
        });
      }, DEFAULT_GC_INTERVAL_IN_MILLISECONDS);

      return () => clearInterval(interval);
    }

    return;
  }, [pendingIds]);

  const { data: responseData } = useAdHocLogs(expr, 'now-1h', 'now');

  useEffect(() => {
    if (!newHocCheckRequest || !probes) {
      return;
    }

    const checkState: AdHocCheckState = {
      id: newHocCheckRequest.id,
      probeState: newHocCheckRequest.probes.reduce<AdHocCheckState['probeState']>((acc, probeId) => {
        const probe = probes.find((item) => item.id === probeId);

        if (probe) {
          return {
            ...acc,
            [probe.name]: createProbeState(probeId, probe.name, probe.public),
          };
        }

        return acc;
      }, {}),
      created: dateTime(),
      checkTimeoutInSeconds: newHocCheckRequest.timeout / 1000,
    };
    setLogState((prevState) => {
      if (checkState.id in prevState) {
        return prevState;
      }

      return {
        ...prevState,
        [checkState.id]: checkState,
      };
    });
  }, [newHocCheckRequest, probes]);

  useEffect(() => {
    if (responseData) {
      setLogState((prevState) => {
        return responseData.reduce<AdHocCheckStateMap>((acc, { line }) => {
          if (!(line.id in prevState)) {
            console.error('In-proper data management. Received data of unknown id');
            return acc;
          }

          if (!prevState[line.id] || !(line.probe in prevState[line.id].probeState)) {
            console.error(`In-proper data management. Probe with name ${line.probe} does not exist in local state.`);
            return acc;
          }

          const slice = acc[line.id];
          return {
            ...acc,
            [line.id]: {
              ...slice,
              probeState: {
                ...slice.probeState,
                [line.probe]: {
                  ...slice.probeState[line.probe],
                  logs: line.logs,
                  timeseries: line.timeseries,
                  state: ProbeStateStatus.Success,
                },
              },
            },
          };
        }, prevState);
      });
    }
  }, [responseData]);

  const hasPendingChecks = pendingIds.length > 0;

  return { items, hasPendingChecks, isLoadingProbes };
}
