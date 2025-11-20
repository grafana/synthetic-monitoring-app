import React, { useEffect, useMemo, useState } from 'react';
import { dateTime, dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Button, EmptyState, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { AdHocCheckState, ProbeStateStatus } from './types.adhoc-check';
import { useProbes } from 'data/useProbes';
import { useCanReadLogs } from 'hooks/useDSPermission';

import { CenteredSpinner } from '../../../CenteredSpinner';
import { Column } from '../../components/ui/Column';
import {
  DEFAULT_GC_INTERVAL_IN_MILLISECONDS,
  DEFAULT_TIMEOUT_IN_SECONDS,
  INSUFFICIENT_LOG_ACCESS_MESSAGE,
} from './constants';
import { LogsPanel } from './LogsPanel';
import { useAdHocLogs } from './useAdHocLogs';
import { useOnBeforeAdhocCheck } from './useOnBeforeAdhocCheck';

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

export function AdhocCheckPanel() {
  const canReadLogs = useCanReadLogs();
  const styles = useStyles2(getStyles);
  const [logState, setLogState] = useState<AdHocCheckStateMap>({});
  const { data: probes, isLoading: isLoadingProbes } = useProbes(); // This will also make the execution step work, fix so that it always works
  const { doAdhocCheck, data: newHocCheckRequest } = useOnBeforeAdhocCheck();
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
      return {
        ...prevState,
        [checkState.id]: checkState,
      };
    });
  }, [newHocCheckRequest, probes]);

  const handleAdHocCheck = () => {
    doAdhocCheck();
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

  if (isLoadingProbes) {
    return <CenteredSpinner />;
  }

  if (!items.length) {
    return (
      <div className={styles.root}>
        <EmptyState
          message="You can test your check to see how it behaves in the wild"
          variant="completed"
          button={
            <Button
              data-testid={CHECKSTER_TEST_ID.feature.adhocCheck.TestButton.root}
              disabled={!canReadLogs}
              aria-disabled={!canReadLogs}
              data-disabled={!canReadLogs}
              tooltip={!canReadLogs ? INSUFFICIENT_LOG_ACCESS_MESSAGE : undefined}
              variant="secondary"
              type="button"
              onClick={handleAdHocCheck}
            >
              Test
            </Button>
          }
        >
          {canReadLogs ? 'Before you save your check, test how it will behave.' : `${INSUFFICIENT_LOG_ACCESS_MESSAGE}.`}
        </EmptyState>
      </div>
    );
  }

  return (
    <Column gap={2} className={styles.root}>
      <div>
        <Button
          data-testid={CHECKSTER_TEST_ID.feature.adhocCheck.TestButton.root}
          disabled={!canReadLogs || hasPendingChecks}
          tooltip={
            hasPendingChecks
              ? `You'll have to wait for pending checks to complete/timeout before you can trigger a new test`
              : undefined
          }
          variant="secondary"
          type="button"
          onClick={handleAdHocCheck}
        >
          Test
        </Button>
      </div>

      <Column gap={1}>
        <h6>Test results</h6>
        {[...items].reverse().map((item) => (
          <Column gap={1} key={item.id}>
            <div>{dateTimeFormat(item.created)}</div>
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
          </Column>
        ))}
      </Column>
    </Column>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    root: css`
      padding: ${theme.spacing(1, 1, 1, 0)};
    `,
  };
}
