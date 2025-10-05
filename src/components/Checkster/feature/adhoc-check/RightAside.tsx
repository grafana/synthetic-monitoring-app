import React, { useEffect, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { dateTime } from '@grafana/data';
import { Button, EmptyState } from '@grafana/ui';
import { css } from '@emotion/css';

import { AdHocCheckState, ProbeStateStatus } from './types.adhoc-check';
import { CheckFormValues } from 'types';
import { useProbes } from 'data/useProbes';

import { toPayload } from '../../utils/adaptors';
import { LogsPanel } from './LogsPanel';
import { useAdHocCheck } from './useAdHocCheck';
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

export function RightAside() {
  const { getValues, trigger } = useFormContext<CheckFormValues>();
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
  const expr = pendingIds.length ? `{type="adhoc"} |~"${pendingIds.join('|')}" | json` : undefined;

  useEffect(() => {
    if (pendingIds.length) {
      const interval = setInterval(() => {
        const now = dateTime();
        setLogState((prevState) => {
          return pendingIds.reduce<AdHocCheckStateMap>((acc, id) => {
            if (acc[id] && now.diff(acc[id].created, 'seconds') > 10) {
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
      }, 5000);

      return () => clearInterval(interval);
    }

    return;
  }, [pendingIds]);

  const { data: responseData } = useAdHocLogs(expr, 'now-1h', 'now');
  const { mutate: doAdhocCheck, data: newHocCheckRequest } = useAdHocCheck();

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
    };
    setLogState((prevState) => {
      return {
        ...prevState,
        [checkState.id]: checkState,
      };
    });
  }, [newHocCheckRequest, probes]);

  const handleAdHocCheck = () => {
    trigger().then((isValid) => {
      if (!isValid) {
        return;
      }
      const formValues = getValues();
      const adHocCheckPayload = toPayload(formValues);
      if (adHocCheckPayload) {
        doAdhocCheck(adHocCheckPayload);
      }
    });
  };

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
          console.log('the time series', line.timeseries);
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

  useEffect(() => {
    console.log('responseData', responseData);
  }, [responseData]);

  if (isLoadingProbes) {
    return <div>Loading probes...</div>;
  }

  if (!items.length) {
    return (
      <EmptyState
        message={`You can test your check to see how it behaves in the wild`}
        variant={'completed'}
        button={
          <Button variant="secondary" type="button" onClick={handleAdHocCheck}>
            Test
          </Button>
        }
      >
        Before you save your check, test how it will behave.
      </EmptyState>
    );
  }

  return (
    <div
      className={css`
        padding: 8px 8px 8px 0;
      `}
    >
      <Button variant="secondary" type="button" onClick={handleAdHocCheck}>
        Test
      </Button>
      <h6>Test results</h6>
      {items.map((item) => (
        <div key={item.id}>
          {Object.values(item.probeState).map((state) => {
            return (
              <LogsPanel
                key={state.name}
                timeseries={state.timeseries}
                logs={state.logs}
                probe={state.name}
                state={state.state}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
