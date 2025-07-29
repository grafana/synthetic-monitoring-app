import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom-v5-compat';
import { DateTime, dateTime, dateTimeFormat, GrafanaTheme2, LoadingState, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import {
  Alert,
  Badge,
  BadgeColor,
  Box,
  Button,
  Divider,
  IconName,
  PanelChrome,
  useSplitter,
  useStyles2,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckFormValues, CheckPageParams } from '../../types';
import { useAdHocCheck, useChecks } from 'data/useChecks';

import { toPayload } from '../../components/CheckEditor/checkFormTransformations';
import { CheckForm } from '../../components/CheckForm/CheckForm';
import { findFieldToFocus } from '../../components/CheckForm/CheckForm.utils';
import { CheckFormContextProvider, useCheckFormMetaContext } from '../../components/CheckForm/CheckFormContext';
import { useSetActiveSectionByError } from '../../components/CheckForm/FormLayout/FormLayoutContext';
import { Preformatted } from '../../components/Preformatted';
import { useProbes } from '../../data/useProbes';
import { trackAdhocCreated } from '../../features/tracking/checkFormEvents';
import { WikCard } from './components/WikCard';
import { useAdHocLogs } from './hooks/useAdHocLogs';

const TIMEOUT_SECONDS = 10;

interface RequestState {
  id: string;
  logs: Array<{
    probe: string;
    logs: Record<string, unknown>;
    state: 'pending' | 'success' | 'error' | 'timeout';
  }>;
  created: DateTime;
}

export function LayoutTestPage() {
  const { id } = useParams<CheckPageParams>();
  const { data: checks, isLoading } = useChecks();
  const check = checks?.find((c) => c.id === Number(id));
  return (
    <CheckFormContextProvider check={check}>
      <LayoutTestPageContent isLoading={isLoading} />
    </CheckFormContextProvider>
  );
}

function LayoutTestPageContent({ isLoading }: { isLoading: boolean }) {
  const { check, checkType, checkState } = useCheckFormMetaContext();
  const methods = useFormContext<CheckFormValues>();
  const styles = useStyles2(getStyles);
  const {
    containerProps: { className: containerClassName, ...containerProps },
    primaryProps,
    secondaryProps,
    splitterProps,
  } = useSplitter({
    direction: 'row',
    initialSize: 1,
    dragPosition: 'end',
  });

  const setActiveSectionByError = useSetActiveSectionByError();

  const [expand, setExpand] = useState(false);
  const handleToggleExpand = () => {
    setExpand(!expand);
  };
  const [requestState, setRequestState] = useState<RequestState[]>([]);
  const { data: probeList } = useProbes();

  const { mutate: adHocCheck, error, isPending, isError, data: requestResponseData } = useAdHocCheck();
  const requestIds = requestState.map((request) => request.id).join('|');
  const hasPendingRequests =
    requestState.filter((request) => request.logs.some((item) => item.state === 'pending')).length > 0;
  const expr = requestIds.length ? `{type="adhoc"} |~"${requestIds}" | json` : undefined;
  const { data: logs, isFetching } = useAdHocLogs(expr, 'now-1h', 'now', hasPendingRequests);

  useEffect(() => {
    setRequestState([]);
  }, [check]);

  const getProbeStatus = (checkIndex: number, probeName: string) => {
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

  useEffect(() => {
    if (!requestResponseData) {
      return;
    }

    setRequestState((prevState) => {
      return [
        ...prevState,
        {
          id: requestResponseData.id,
          logs: requestResponseData.probes.map((probeId) => ({
            // @fixme! assuming that probeList has loaded! NO BUENO!
            probe: probeList?.find((probe) => probe.id === probeId)?.name ?? 'Unknown',
            logs: {},
            state: 'pending',
          })),
          created: dateTime(),
        },
      ];
    });
  }, [probeList, requestResponseData]);

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

  if (isLoading) {
    return <div>Hold tight!</div>;
  }

  return (
    <PluginPage layout={PageLayoutType.Custom} pageNav={{ text: 'Edit check' }}>
      <div {...containerProps} className={cx(containerClassName, styles.container)}>
        <div {...primaryProps} className={styles.primarySection}>
          <Box grow={1} padding={2} backgroundColor="primary">
            <CheckForm />
          </Box>
        </div>
        <div {...splitterProps} />
        <div {...secondaryProps}>
          <div className={styles.rightAside}>
            <Box grow={1} backgroundColor="primary" padding={2} maxHeight={{ xs: '100%' }}>
              {isError && (
                <Alert title="AdHocError" severity="error">
                  {error?.message ?? 'Unknown error'}
                </Alert>
              )}
              <Button
                onClick={handleAdHocCheck}
                icon={isPending || hasPendingRequests ? 'fa fa-spinner' : undefined}
                disabled={isPending || hasPendingRequests}
              >
                Test check
              </Button>
              <Divider />
              <div className={styles.rightAsideFlex}>
                {[...requestState].reverse().map((state, index) => {
                  const probesInSegment = state.logs.map((item) => getProbeStatus(index, item.probe));
                  const isLoadingState = state.logs.some((logState) => logState.state === 'pending');
                  console.log(state);
                  return (
                    <PanelChrome
                      key={state.id}
                      title={dateTimeFormat(state.created)}
                      loadingState={isLoadingState ? LoadingState.Loading : LoadingState.Done}
                      actions={
                        <div className={styles.probeTop} onClick={handleToggleExpand}>
                          {probesInSegment.map((pState) => (
                            // @ts-expect-error testing
                            <Badge key={pState.name} text={pState.name} icon={pState.icon} color={pState.color} />
                          ))}
                        </div>
                      }
                    >
                      <div>
                        {state.logs.map((probeState, probeIndex) => {
                          const probeStuff = probesInSegment.find((s) => s.name === probeState.probe);
                          return (
                            <WikCard key={`${state.id}-${probeState.probe}`}>
                              <WikCard.Heading>
                                <div>
                                  <Badge
                                    // @ts-expect-error testing
                                    icon={probeStuff?.icon ?? 'adjust-circle'}
                                    text={probeStuff?.name ?? 'Unknown error'}
                                    // @ts-expect-error testing
                                    color={probeStuff?.color ?? 'red'}
                                  />
                                  <span>{(probeState.logs?.message as string) ?? ''}</span>
                                </div>
                                <div>{getProbeSuccess(probeState.logs?.timeseries)}</div>
                              </WikCard.Heading>

                              <div className={styles.steps}>
                                {!!probeState.logs.logs &&
                                  // @ts-expect-error testing
                                  probeState.logs?.logs?.map(({ msg, ...logObj }, index) => {
                                    const invalid =
                                      msg.search(
                                        /invalid|Uncaught \(in promise\)|script did not execute successfully/i
                                      ) > -1;
                                    const [mess, messInfo = null, ...restMesss] = msg.split('\n');
                                    return (
                                      <div key={index}>
                                        <div className={cx(styles.stepTitle, invalid && 'invalid')}>
                                          <span>{index + 1}</span>
                                          <span>
                                            <strong>{mess}</strong> {messInfo}
                                          </span>
                                        </div>
                                        <div className={styles.stepContent}>
                                          {!!restMesss && restMesss.length > 0 && expand && (
                                            <Preformatted
                                              className={styles.k6Info}
                                              highlight={[
                                                'GET',
                                                'POST',
                                                'PUT',
                                                'DELETE',
                                                'PATCH',
                                                '***SECRET_REDACTED***',
                                                '302 Found',
                                                '301 Moved Permanently',
                                                '200 OK',
                                              ]}
                                            >
                                              {mess} {messInfo}
                                              {'\n'}
                                              {/* @ts-expect-error testing */}
                                              {restMesss.filter((val) => !!val).join('\n')}
                                            </Preformatted>
                                          )}
                                          {(invalid || expand) && (
                                            <Preformatted>
                                              {Object.entries(logObj).map(([key, value]) => (
                                                <div key={key}>
                                                  {key}: <span className={styles.mutedText}>{value}</span>
                                                </div>
                                              ))}
                                            </Preformatted>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </WikCard>
                          );
                        })}
                      </div>
                    </PanelChrome>
                  );
                })}
              </div>
            </Box>
          </div>
        </div>
      </div>
    </PluginPage>
  );
}

function getProbeSuccess(timeseries: unknown) {
  if (!Array.isArray(timeseries)) {
    return null;
  }

  const metric = timeseries.find((item) => item.name === 'probe_success');
  if (!metric) {
    return null;
  }
  return !!metric?.metric?.[0]?.gauge?.value ? 'success' : 'error';
}

function getStateIcon(state: 'pending' | 'success' | 'error' | 'timeout'): IconName {
  switch (state) {
    case 'pending':
      return 'fa fa-spinner';
    case 'error':
      return 'bug';
    case 'timeout':
      return 'exclamation-triangle';
    case 'success':
      return 'check-circle';
  }
}

function getStateColorIndex(state: 'pending' | 'success' | 'error' | 'timeout'): BadgeColor {
  switch (state) {
    case 'pending':
      // @ts-expect-error This is correct
      return 'darkgrey';
    case 'success':
      return 'green';
    case 'timeout':
      return 'orange';
    case 'error':
      return 'red';
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    container-type: inline-size;
    background-color: ${theme.colors.background.primary};
    height: 100%;
    overflow: hidden;
    flex: 1 1 0;
  `,
  primarySection: css`
    max-height: 100%;
    overflow: auto;
  `,
  rightAside: css`
    min-width: ${theme.spacing(40)};
    max-height: 100%;
    overflow: auto;
    display: flex;
    border-left: 1px solid ${theme.colors.border.weak};
    flex-grow: 1;
    @container (min-width: 1224px) {
      width: ${theme.spacing(70)};
      min-width: ${theme.spacing(20)};
    }
  `,
  adHocResult: css`
    padding: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    background-color: ${theme.colors.background.secondary};
  `,
  probeResult: css`
    &.pending {
    }
    &.error {
      color: ${theme.colors.error.text};
    }
    &.timeout {
      color: ${theme.colors.warning.text};
    }
    &.success {
      color: ${theme.colors.success.text};
    }
  `,
  stepTitle: css`
    display: flex;
    gap: ${theme.spacing(1)};
    align-items: center;
    margin: ${theme.spacing(0.5)} 0;
    position: relative;
    color: ${theme.colors.text.secondary};

    &:not(.invalid) > span > strong {
      color: ${theme.colors.text.primary};
    }

    &.invalid {
      color: ${theme.colors.error.text};
    }

    & > span:first-child {
      line-height: 0.8em;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${theme.colors.text.primary};
    }
  `,
  mutedText: css`
    opacity: 0.6;
  `,
  steps: css`
    & > div:last-child > div:before {
      display: none;
    }
  `,
  stepContent: css`
    position: relative;
    min-height: ${theme.spacing(2)};
    padding-left: ${theme.spacing(2)};

    &:before {
      content: '';
      border-left: 2px solid ${theme.colors.border.weak};
      width: 2px;
      position: absolute;
      height: 100%;
      left: 7px;
    }
  `,
  k6Info: css`
    background-color: ${theme.colors.background.secondary};
  `,
  probeTop: css`
    margin-top: ${theme.spacing(1)};
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  rightAsideFlex: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(2)};
  `,
});
