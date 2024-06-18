import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { CheckFormValues } from 'types';
import { useTestCheck } from 'data/useChecks';
import {
  DNSRequestFields,
  GRPCRequestFields,
  HttpRequestFields,
  PingRequestFields,
  TCPRequestFields,
  TracerouteRequestFields,
} from 'components/CheckEditor/CheckEditor.types';
import { toPayload } from 'components/CheckEditor/checkFormTransformations';

type ContextProps = {
  supportingContent: {
    requests: any[];
    addRequest: (fields: RequestFields) => void;
  };
};

export const CheckFormContext = createContext<ContextProps>({
  supportingContent: {
    requests: [],
    addRequest: (fields: RequestFields) => {
      console.log(`fields`);
    },
  },
});

type RequestFields =
  | HttpRequestFields
  | DNSRequestFields
  | GRPCRequestFields
  | TCPRequestFields
  | TracerouteRequestFields
  | PingRequestFields;

export const CheckFormContextProvider = ({ children }: { children: ReactNode }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const { getValues } = useFormContext<CheckFormValues>();
  const { mutate } = useTestCheck();

  const addRequest = useCallback(
    (fields: RequestFields) => {
      const values = pullOutRequestValues(fields, getValues());
      const id = Math.random();

      setRequests((prev) => [
        ...prev,
        {
          id,
          check: {
            payload: values,
            state: `pending`,
          },
          data: {
            state: `pending`,
            result: null,
          },
        },
      ]);

      mutate(toPayload(values), {
        onSuccess: (data) => {
          setRequests((prev) => {
            const index = prev.find((req) => req.id === id);

            if (!index) {
              return prev;
            }

            return prev.map((req) => {
              if (req.id === id) {
                return {
                  ...req,
                  check: {
                    ...req.check,
                    state: `success`,
                  },
                  data: {
                    state: `success`,
                    result: data,
                  },
                };
              }

              return req;
            });
          });
        },
        onError: (error) => {
          setRequests((prev) => [
            ...prev,
            {
              check: {
                payload: values,
                state: `error`,
              },
              data: {
                state: `pending`,
                result: null,
              },
            },
          ]);
        },
      });
    },
    [getValues, mutate]
  );

  const value = useMemo(() => {
    return {
      supportingContent: {
        requests,
        addRequest,
      },
    };
  }, [requests, addRequest]);

  return <CheckFormContext.Provider value={value}>{children}</CheckFormContext.Provider>;
};

export function useCheckFormContext() {
  const context = useContext(CheckFormContext);

  if (!context) {
    throw new Error('useCheckFormContext must be used within a CheckFormContextProvider');
  }

  return context;
}

function pullOutRequestValues(fields: RequestFields, values: CheckFormValues) {
  console.log(values);

  return values;
}
