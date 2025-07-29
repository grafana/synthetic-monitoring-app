import React from 'react';
import { dateTimeFormat,GrafanaTheme2, LoadingState } from '@grafana/data';
import { Alert, Badge, Box, Button, Divider, PanelChrome, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { RequestState } from './CheckSidePanel.types';

import { WikCard } from '../../page/LayoutTestPage/components/WikCard';
import { Preformatted } from '../Preformatted';
import { HIGHLIGHT_PATTERNS } from './CheckSidePanel.utils';

interface CheckSidePanelViewProps {
  requestState: RequestState[];
  expand: boolean;
  hasPendingRequests: boolean;
  onAdHocCheck: () => void;
  onToggleExpand: () => void;
  getProbeStatus: (checkIndex: number, probeName: string) => any;
  isError: boolean;
  error?: Error | null;
  isPending: boolean;
}

export function CheckSidePanelView({
  requestState,
  expand,
  hasPendingRequests,
  onAdHocCheck,
  onToggleExpand,
  getProbeStatus,
  isError,
  error,
  isPending,
}: CheckSidePanelViewProps) {
  const styles = useStyles2(getCheckSidePanelStyles);

  return (
    <div className={styles.rightAside}>
      <Box grow={1} backgroundColor="primary" padding={2} maxHeight={{ xs: '100%' }}>
        {isError && (
          <Alert title="AdHocError" severity="error">
            {error?.message ?? 'Unknown error'}
          </Alert>
        )}
        <Button
          onClick={onAdHocCheck}
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
            return (
              <PanelChrome
                key={state.id}
                title={dateTimeFormat(state.created)}
                loadingState={isLoadingState ? LoadingState.Loading : LoadingState.Done}
                actions={
                  <div className={styles.probeTop} onClick={onToggleExpand}>
                                         {probesInSegment.map((pState) => (
                       <Badge key={pState.name} text={pState.name} icon={pState.icon} color={pState.color} />
                     ))}
                  </div>
                }
              >
                <div>
                  {state.logs.map((probeState) => {
                    const probeStuff = probesInSegment.find((s) => s.name === probeState.probe);
                    return (
                      <WikCard key={`${state.id}-${probeState.probe}`}>
                        <WikCard.Heading>
                                                     <div>
                             <Badge
                               icon={probeStuff?.icon ?? 'adjust-circle'}
                               text={probeStuff?.name ?? 'Unknown error'}
                               color={probeStuff?.color ?? 'red'}
                             />
                            <span>{(probeState.logs?.message as string) ?? ''}</span>
                          </div>
                          <div>{probeState.logs?.timeseries ? 'success' : 'error'}</div>
                        </WikCard.Heading>

                        <div className={styles.steps}>
                          {!!probeState.logs.logs &&
                            // @ts-expect-error testing
                            probeState.logs?.logs?.map(({ msg, ...logObj }, index) => {
                              const invalid =
                                msg.search(/invalid|Uncaught \(in promise\)|script did not execute successfully/i) >
                                -1;
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
                                      <Preformatted className={styles.k6Info} highlight={HIGHLIGHT_PATTERNS}>
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
  );
}

const getCheckSidePanelStyles = (theme: GrafanaTheme2) => ({
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
}); 
