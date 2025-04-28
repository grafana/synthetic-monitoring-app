import { useCallback, useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DataFrameJSON, dateTime } from '@grafana/data';
import { merge } from 'lodash';

import { Request } from './CheckFormContext.types';
import { CheckFormValues, Probe } from 'types';
import { useTestCheck } from 'data/useChecks';
import { useLogs } from 'data/useLogs';
import { useProbes } from 'data/useProbes';
import { RequestFields } from 'components/CheckEditor/CheckEditor.types';
import { toPayload } from 'components/CheckEditor/checkFormTransformations';

// todo: this needs work and isn't used currently
export function useTestRequests() {
  const { mutate: getResults } = useLogs();
  const [requests, setRequests] = useState<Request[]>([]);
  const { mutate: testCheck } = useTestCheck();
  const { data: probes } = useProbes();
  const { getValues } = useFormContext<CheckFormValues>();

  const latestRequest = requests[requests.length - 1];
  const getRequestData = latestRequest?.data.state === `pending` && latestRequest?.data.adHocId;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    if (getRequestData) {
      interval = setInterval(() => {
        const now = Date.now();
        const from = dateTime(now).subtract(5, 'm');
        const to = dateTime(now);

        getResults(
          { expr: `{type="adhoc"} |= "${latestRequest.data.adHocId}"`, range: { raw: { from, to }, from, to } },
          {
            onSuccess: (data) => {
              const parsed = parseLogLine(data);

              if (parsed) {
                setRequests((prev) =>
                  updateRequest(prev, latestRequest.id, {
                    data: {
                      state: `pending`,
                      result: parsed,
                    },
                  })
                );

                clearInterval(interval);
              }

              timeout = setTimeout(() => {
                clearInterval(interval);
                clearTimeout(timeout);
              }, 30000);
            },
            onError: (err) => {
              clearInterval(interval);
              clearTimeout(timeout);
            },
          }
        );
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [getRequestData, getResults, latestRequest]);

  const addRequest = useCallback(
    (fields: RequestFields) => {
      if (probes?.length) {
        const values = pullOutRequestValues(fields, getValues(), probes);
        const id = Math.random();

        setRequests((prev) => newRequest(prev, id, values));

        testCheck(toPayload(values), {
          onSuccess: (data) => {
            setRequests((prev) =>
              updateRequest(prev, id, {
                check: {
                  state: `success`,
                },
                data: {
                  adHocId: data.id,
                  state: `pending`,
                },
              })
            );
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
        });
      }
    },
    [getValues, testCheck, probes]
  );

  return { requests, addRequest };
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

function pullOutRequestValues(fields: RequestFields, values: CheckFormValues, probes: Probe[]) {
  const probeId = probes[0].id as number;

  return {
    ...values,
    probes: [probeId],
  };
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
      result: null,
    },
  };

  if (lastEntry?.check.state === `error`) {
    return [...state.slice(0, state.length - 1), newEntry];
  }

  return [...state, newEntry];
}

function parseLogLine(dataFrames: DataFrameJSON[]) {
  const firstFrame = dataFrames[0];

  if (firstFrame) {
    const schema = firstFrame.schema;
    const lineIndex = schema?.fields.findIndex((field) => field.name === `Line`) || -1;
    const data = firstFrame.data;
    const logLineRow = data?.values[lineIndex];
    const line = logLineRow?.[0] as string;

    if (line) {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.log(`couldn't parse line: ${line}`); // eslint-disable-line no-console
        return null;
      }
    }
  }

  return null;
}
