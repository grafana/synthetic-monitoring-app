import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { dateTime } from '@grafana/data';

import { CheckFormValues } from '../../types';
import { ProbeStatus,RequestState } from './CheckSidePanel.types';

import { useAdHocCheck } from '../../data/useChecks';
import { useProbes } from '../../data/useProbes';
import { trackAdhocCreated } from '../../features/tracking/checkFormEvents';
import { toPayload } from '../CheckEditor/checkFormTransformations';
import { findFieldToFocus } from '../CheckForm/CheckForm.utils';
import { useCheckFormMetaContext } from '../CheckForm/CheckFormContext';
import { useSetActiveSectionByError } from '../CheckForm/FormLayout/FormLayoutContext';
import { useAdHocLogs } from './hooks/useAdHocLogs';
import { getProbeSuccess, getStateColorIndex, getStateIcon, TIMEOUT_SECONDS } from './CheckSidePanel.utils';

export function useCheckSidePanel() {
  const { check, checkType, checkState } = useCheckFormMetaContext();
  const methods = useFormContext<CheckFormValues>();
  const setActiveSectionByError = useSetActiveSectionByError();
  
  // UI State
  const [expand, setExpand] = useState(false);
  const [requestState, setRequestState] = useState<RequestState[]>([]);
  
  // Data hooks
  const { data: probeList, isLoading } = useProbes();
  const { mutate: adHocCheck, error, isPending, isError, data: requestResponseData } = useAdHocCheck();
  
  // Logs query setup
  const requestIds = requestState.map((request) => request.id).join('|');
  const hasPendingRequests = requestState.filter((request) => 
    request.logs.some((item) => item.state === 'pending')
  ).length > 0;
  const expr = requestIds.length ? `{type="adhoc"} |~"${requestIds}" | json` : undefined;
  const { data: logs, isFetching } = useAdHocLogs(expr, 'now-1h', 'now', hasPendingRequests);

  // Reset state when check changes
  useEffect(() => {
    setRequestState([]);
  }, [check]);

  // Handle new ad-hoc check response
  useEffect(() => {
    if (!requestResponseData || isLoading) {
      return;
    }

    setRequestState((prevState) => [
      ...prevState,
      {
        id: requestResponseData.id,
        logs: requestResponseData.probes.map((probeId) => ({
          probe: probeList?.find((probe) => probe.id === probeId)?.name ?? 'Unknown',
          logs: {},
          state: 'pending',
        })),
        created: dateTime(),
      },
    ]);
  }, [probeList, requestResponseData, isLoading]);

  // Process incoming logs
  useEffect(() => {
    if (!logs || !hasPendingRequests) {
      return;
    }

    let draft: RequestState[] = [];

    for (const logData of logs) {
      const request =
        // @ts-expect-error testing
        draft.find((request) => request.id === logData.line.id) ??
        // @ts-expect-error testing
        requestState.find((request) => request.id === logData.line.id);
      if (!request || !request.logs.some((log) => log.state === 'pending')) {
        continue;
      }

      const draftRequest: RequestState = {
        ...request,
        // @ts-expect-error testing
        logs: request.logs.map((probeLogs) => {
          // @ts-expect-error POC
          const subject = logs.find((log) => log.line.probe === probeLogs.probe);
          if (subject) {
            return {
              ...probeLogs,
              logs: subject.line,
              state: 'success',
            };
          }
          return probeLogs;
        }),
      };

      if (draft.find((item) => item.id === draftRequest.id)) {
        draft = draft.map((item) => {
          if (item.id === draftRequest.id) {
            return draftRequest;
          }
          return item;
        });
      } else {
        draft.push(draftRequest);
      }
    }

    // Handle timeouts
    const timedout = requestState.filter(
      (item) =>
        item.logs.some((logState) => logState.state === 'pending') &&
        item.created.unix() < dateTime().subtract(TIMEOUT_SECONDS, 'seconds').unix()
    );

    if (timedout.length) {
      for (const timed of timedout) {
        const subject = draft.find((item) => item.id === timed.id) ?? { ...timed };
        if (!subject.logs.some((log) => log.state === 'pending')) {
          continue;
        }
        if (draft.find((item) => subject.id === item.id)) {
          draft = draft.map((item) => {
            return item.id === subject.id
              ? {
                  ...subject,
                  logs: subject.logs.map((probeState) => {
                    return probeState.state === 'pending'
                      ? { ...probeState, logs: { message: 'ad-hoc check timeout' }, state: 'timeout' }
                      : probeState;
                  }),
                }
              : item;
          });
        } else {
          draft.push({
            ...subject,
            logs: subject.logs.map((probeState) => {
              return probeState.state === 'pending'
                ? { ...probeState, logs: { message: 'ad-hoc check timeout' }, state: 'timeout' }
                : probeState;
            }),
          });
        }
      }
    }

    if (draft.length) {
      setRequestState((prevState) => {
        return prevState.map((item) => {
          const replacement = draft.find((draftState) => draftState.id === item.id);
          if (replacement) {
            return replacement;
          }
          return item;
        });
      });
    }
  }, [logs, hasPendingRequests, requestState, isFetching]);

  // Get probe status for a specific request and probe
  const getProbeStatus = (checkIndex: number, probeName: string): ProbeStatus => {
    const request = [...requestState].reverse()[checkIndex];
    if (!request) {
      return {
        name: probeName,
        state: 'error',
        color: 'red',
        icon: 'bug',
        probeSuccess: 'error',
      };
    }
    const item = request.logs.find((p) => p.probe === probeName);
    if (!item) {
      return {
        name: probeName,
        state: 'error',
        color: 'red',
        icon: 'bug',
        probeSuccess: 'error',
      };
    }

    const probeSuccess = getProbeSuccess(item.logs?.timeseries) ?? item.state;
    return {
      name: probeName,
      state: item.state,
      icon: getStateIcon(probeSuccess),
      color: getStateColorIndex(probeSuccess),
      probeSuccess,
    };
  };

  // Handle ad-hoc check execution
  const handleAdHocCheck = () => {
    methods.trigger().then((isValid) => {
      if (!isValid) {
        const errors = methods.formState.errors;
        setActiveSectionByError(errors);
        setTimeout(() => {
          findFieldToFocus(errors);
        }, 200);
        return;
      }
      
      const formValues = methods.getValues();
      trackAdhocCreated({ checkType, checkState });
      const adHocCheckPayload = toPayload(formValues);
      if (adHocCheckPayload) {
        adHocCheck(adHocCheckPayload);
      }
    });
  };

  // Toggle expand state
  const handleToggleExpand = () => {
    setExpand(!expand);
  };

  return {
    // State
    requestState,
    expand,
    hasPendingRequests,
    
    // API state
    isPending,
    isError,
    error,
    
    // Actions
    handleAdHocCheck,
    handleToggleExpand,
    getProbeStatus,
  };
} 

