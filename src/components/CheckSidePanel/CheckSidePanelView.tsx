import React, { useState } from 'react';
import { dateTimeFormat, GrafanaTheme2, LoadingState } from '@grafana/data';
import { Alert, Badge, Box, Button, PanelChrome, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckSidePanelTab, LogMessage, ProbeStatus } from './CheckSidePanel.types';

import { Preformatted } from '../Preformatted';
import { WikCard } from './components/WikCard';
import { HIGHLIGHT_PATTERNS } from './CheckSidePanel.utils';
import { useCheckSidePanel } from './useCheckSidePanel';

export function CheckSidePanelView() {
  const styles = useStyles2(getCheckSidePanelStyles);
  const [activeTab, setActiveTab] = useState<CheckSidePanelTab>('test-preview');

  const {
    requestState,
    expand,
    hasPendingRequests,
    handleAdHocCheck: onAdHocCheck,
    handleToggleExpand: onToggleExpand,
    getProbeStatus,
    isError,
    error,
    isPending,
  } = useCheckSidePanel();

  return (
    <div className={styles.rightAside}>
      <Box grow={1} backgroundColor="primary" padding={2} maxHeight={{ xs: '100%' }}>
        {isError && (
          <Alert title="AdHocError" severity="error">
            {error?.message ?? 'Unknown error'}
          </Alert>
        )}
        <TabsBar>
          <Tab
            label="Test preview"
            onChangeTab={() => setActiveTab('test-preview')}
            active={activeTab === 'test-preview'}
          />
          <Tab
            label="Documentation"
            onChangeTab={() => setActiveTab('documentation')}
            active={activeTab === 'documentation'}
          />
        </TabsBar>
        <TabContent>
          {activeTab === 'test-preview' && (
            <>
              <div className={styles.buttonContainer}>
                <Button
                  onClick={onAdHocCheck}
                  icon={isPending || hasPendingRequests ? 'fa fa-spinner' : undefined}
                  disabled={isPending || hasPendingRequests}
                  variant="secondary"
                >
                  Test
                </Button>
              </div>

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
                          {probesInSegment.map((pState: ProbeStatus) => (
                            <Badge key={pState.name} text={pState.name} icon={pState.icon} color={pState.color} />
                          ))}
                        </div>
                      }
                    >
                      <div>
                        {state.logs.map((probeState) => {
                          const probeStuff = probesInSegment.find((s) => s.name === probeState.probe);
                          const status =
                            probeState.state === 'pending'
                              ? 'pending'
                              : probeState.logs?.timeseries
                              ? 'success'
                              : 'error';

                          return (
                            <WikCard key={`${state.id}-${probeState.probe}`}>
                              <WikCard.Heading>
                                <div>
                                  <Badge
                                    icon={(probeStuff?.icon as any) ?? 'adjust-circle'}
                                    text={probeStuff?.name ?? 'Unknown error'}
                                    color={probeStuff?.color ?? 'red'}
                                  />
                                  <span>{(probeState.logs?.message as string) ?? ''}</span>
                                </div>
                                <div>{status}</div>
                              </WikCard.Heading>

                              <div className={styles.steps}>
                                {!!probeState.logs.logs &&
                                  probeState.logs.logs.map(({ msg, ...logObj }: LogMessage, index: number) => {
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
                                            <Preformatted className={styles.k6Info} highlight={HIGHLIGHT_PATTERNS}>
                                              {mess} {messInfo}
                                              {'\n'}
                                              {restMesss.filter((val): val is string => !!val).join('\n')}
                                            </Preformatted>
                                          )}
                                          {(invalid || expand) && (
                                            <Preformatted>
                                              {Object.entries(logObj).map(([key, value]) => (
                                                <div key={key}>
                                                  {key}: <span className={styles.mutedText}>{`${value}`}</span>
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
            </>
          )}
          {activeTab === 'documentation' && <div>{/* Documentation content will be added here */}</div>}
        </TabContent>
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
  buttonContainer: css`
    margin-top: ${theme.spacing(2)};
    margin-bottom: ${theme.spacing(2)};
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
