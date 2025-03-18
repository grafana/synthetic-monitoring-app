import { useCallback, useEffect, useState } from 'react';
import { dateTime } from '@grafana/data';
import { AdHocLog, parseAdHocLogs } from 'features/parseAdHocLogs/parseAdHocLogs';
import { queryLoki } from 'features/queryDatasources/queryLoki';
import { merge } from 'lodash';

import { Request } from './CheckFormContext.types';
import { CheckFormValues } from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useTestCheck } from 'data/useChecks';
import { useProbes } from 'data/useProbes';
import { useLogsDS } from 'hooks/useLogsDS';
import { RequestFields } from 'components/CheckEditor/CheckEditor.types';
import { toPayload } from 'components/CheckEditor/checkFormTransformations';

const TIMEOUT_VALUE = 30000;
const INTERVAL_VALUE = 2000;

export function useTestRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const { data: probes = [] } = useProbes();
  const { mutate: testCheck } = useTestCheck();
  const logsDS = useLogsDS();

  const latestRequest = requests[requests.length - 1];
  const requestedProbesLength = latestRequest?.data.probes.length;
  const adHocId = latestRequest?.data.state === `pending` && latestRequest?.data.adHocId;
  const requestId = latestRequest?.id;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (adHocId && logsDS) {
      timeout = setTimeout(() => {
        clearInterval(interval);
      }, TIMEOUT_VALUE);

      interval = setInterval(() => {
        const now = Date.now();
        const from = dateTime(now).subtract(5, 'm');
        const to = dateTime(now);

        const refId = `adhoc-${adHocId}`;

        try {
          queryLoki({
            query: `{type=\`adhoc\`} |= \`${adHocId}\` | logfmt | json`,
            start: from.valueOf(),
            end: to.valueOf(),
            datasource: logsDS,
            refId,
          }).then((res) => {
            const val = res[refId] as AdHocLog[];
            const adHocLogs = parseAdHocLogs(val);
            const result = adHocLogs[0];
            let state: 'pending' | 'success' | 'error' = `pending`;

            if (result.length === requestedProbesLength) {
              clearInterval(interval);
              clearTimeout(timeout);
              state = `success`;
            }

            setRequests((prev) =>
              updateRequest(prev, requestId, {
                data: {
                  state,
                  result,
                },
              })
            );
          });
        } catch (error) {
          console.error(error);
        }
      }, INTERVAL_VALUE);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [logsDS, probes.length, adHocId, requestId, requestedProbesLength]);

  const doTest = useCallback(
    (values: CheckFormValues, onTestSuccess?: (data: AdHocCheckResponse) => void) => {
      if (probes?.length) {
        const id = Math.random();

        setRequests((prev) => newRequest(prev, id, values));
        const onlineProbesAvailable = probes.filter((probe) => probe).map((probe) => probe.id);
        const selectedProbes = values.probes.filter((probe) => onlineProbesAvailable.includes(probe));
        const check = toPayload(values);

        testCheck(
          {
            ...check,
            probes: selectedProbes,
          },
          {
            onSuccess: (data) => {
              setRequests((prev) =>
                updateRequest(prev, id, {
                  check: {
                    state: `success`,
                  },
                  data: {
                    adHocId: data.id,
                    state: `pending`,
                    probes: data.probes,
                  },
                })
              );

              onTestSuccess?.(data);
            },
            onError: (error) => {
              setRequests((prev) =>
                updateRequest(prev, id, {
                  check: {
                    state: `error`,
                  },
                })
              );
            },
          }
        );
      }
    },
    [probes, testCheck]
  );

  // not used currently
  const addIndividualRequest = useCallback(
    (fields: RequestFields, checkFormValues: CheckFormValues, onTestSuccess?: (data: AdHocCheckResponse) => void) => {
      doTest(checkFormValues, onTestSuccess);
    },
    [doTest]
  );

  const addCheckTest = useCallback(
    (checkFormValues: CheckFormValues, onTestSuccess?: (data: AdHocCheckResponse) => void) => {
      doTest(checkFormValues, onTestSuccess);
    },
    [doTest]
  );

  return { requests, addIndividualRequest, addCheckTest };
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function updateRequest(state: Request[], id: number, request: DeepPartial<Request>) {
  const entry = state.find((req) => req.id === id);

  if (!entry) {
    return state;
  }

  return state.map((req) => {
    if (req.id === id) {
      return merge({}, req, request);
    }

    return req;
  });
}

function newRequest(state: Request[], id: number, values: CheckFormValues): Request[] {
  const lastEntry = state[state.length - 1];

  const newEntry: Request = {
    id,
    check: {
      payload: values,
      state: `pending`,
    },
    data: {
      adHocId: null,
      state: `pending`,
      probes: [],
      result: null,
    },
  };

  if (lastEntry?.check.state === `error`) {
    return [...state.slice(0, state.length - 1), newEntry];
  }

  return [...state, newEntry];
}
