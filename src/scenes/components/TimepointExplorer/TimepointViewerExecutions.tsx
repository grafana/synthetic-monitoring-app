import React, { useCallback, useId, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import {
  Alert,
  Box,
  Icon,
  IconName,
  Spinner,
  Stack,
  Tab,
  TabContent,
  TabsBar,
  useStyles2,
  VerticalTab,
} from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { trackTimepointDetailsClicked } from 'features/tracking/timepointExplorerEvents';

import { ExecutionLogs, ProbeExecutionLogs, UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { CheckType } from 'types';
import { PlainButton } from 'components/PlainButton';
import { LogsRenderer } from 'scenes/components/LogsRenderer/LogsRenderer';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { CheckResultMissing } from 'scenes/components/TimepointExplorer/CheckResultMissing';
import { FrontendContext } from 'scenes/components/TimepointExplorer/FrontendContext';
import { ProbeResultMissing } from 'scenes/components/TimepointExplorer/ProbeResultMissing';
import { ProbeResultPending } from 'scenes/components/TimepointExplorer/ProbeResultPending';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useTimepointVizOptions } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  HoveredState,
  StatelessTimepoint,
  TimepointStatus,
  TimepointViewerSource,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { useTimepointViewerExecutions } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.hooks';

interface TimepointViewerExecutionsProps {
  isLoading: boolean;
  logsView: LogsView;
  onChangeSource: (source: TimepointViewerSource) => void;
  pendingProbeNames: string[];
  probeExecutions: ProbeExecutionLogs[];
  probeNameToView?: string;
  selectedSource: TimepointViewerSource;
  timepoint: StatelessTimepoint;
}

export const TimepointViewerExecutions = ({
  isLoading,
  logsView,
  onChangeSource,
  pendingProbeNames,
  probeExecutions = [],
  probeNameToView,
  selectedSource,
  timepoint,
}: TimepointViewerExecutionsProps) => {
  const { checkType, handleHoverStateChange, handleViewerStateChange, viewerState } = useTimepointExplorerContext();
  const [, , viewerExecutionIndex = 0] = viewerState;
  const styles = useStyles2(getStyles);
  const tabId = useId();
  const syntheticTabRef = useRef<HTMLAnchorElement>(null);
  const frontendTabRef = useRef<HTMLAnchorElement>(null);
  const tabsToRender = useTimepointViewerExecutions({
    isLoading,
    pendingProbeNames,
    probeExecutions,
    timepoint,
  });

  const handleChangeTab = useCallback(
    (probeName: string, status: TimepointStatus) => {
      handleViewerStateChange([timepoint, probeName, 0]);
      trackTimepointDetailsClicked({
        checkType,
        component: 'viewer-tab',
        status,
      });
    },
    [checkType, handleViewerStateChange, timepoint]
  );

  const probeTabs = (
    <TabsBar>
      {tabsToRender.map(({ probeName, status, executions }) => {
        const active = probeNameToView === probeName;
        const hoveredState: HoveredState = timepoint ? [timepoint, probeName, 0] : [];
        const label = executions.length > 1 ? `${probeName} (${executions.length})` : probeName;

        return (
          <ProbeNameTab
            key={probeName}
            handleChangeTab={() => handleChangeTab(probeName, status)}
            active={active}
            handleMouseEnter={() => handleHoverStateChange(hoveredState)}
            handleMouseLeave={() => handleHoverStateChange([])}
            status={status}
            probeName={label}
          />
        );
      })}
    </TabsBar>
  );

  const syntheticContent = (
    <Box paddingY={2}>
      {tabsToRender.map(({ probeName, executions, status }) => {
        const active = probeNameToView === probeName;

        if (!active) {
          return null;
        }

        if (isLoading) {
          return (
            <Box key={probeName} minHeight={30} alignItems={'center'} justifyContent={'center'} display={'flex'}>
              <Spinner size={32} />
            </Box>
          );
        }

        if (status === 'pending') {
          return <ProbeResultPending key={probeName} probeName={probeName} timepoint={timepoint} />;
        }

        if (status === 'missing') {
          return <ProbeResultMissing key={probeName} probeName={probeName} timepoint={timepoint} />;
        }

        if (executions.length > 1) {
          return (
            <MultipleExecutions
              key={probeName}
              executions={executions}
              logsView={logsView}
              from={timepoint.adjustedTime}
              to={timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency}
              probeName={probeName}
              timepoint={timepoint}
              viewerExecutionIndex={viewerExecutionIndex}
            />
          );
        }

        return (
          <Stack direction="column" gap={8} key={probeName}>
            {executions.map((execution) => {
              return (
                <LogsRenderer<UnknownExecutionLog>
                  key={execution[0][LokiFieldNames.Id]}
                  logs={execution}
                  logsView={logsView}
                  mainKey="msg"
                  from={timepoint.adjustedTime}
                  to={timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency}
                />
              );
            })}
          </Stack>
        );
      })}
      {!tabsToRender.length && timepoint && <CheckResultMissing />}
    </Box>
  );

  if (checkType !== CheckType.Browser) {
    return (
      <>
        {probeTabs}
        <TabContent>{syntheticContent}</TabContent>
      </>
    );
  }

  const otherSource = selectedSource === 'synthetic' ? 'frontend' : 'synthetic';
  const handleRailKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChangeSource(otherSource);
      (otherSource === 'synthetic' ? syntheticTabRef : frontendTabRef).current?.focus();
    }
  };

  return (
    <>
      {probeTabs}
      <TabContent>
        <div className={styles.railLayout}>
          <div className={styles.rail} role="tablist" aria-label="Timepoint data sources" aria-orientation="vertical">
            <VerticalTab
              ref={syntheticTabRef}
              id={`${tabId}-synthetic`}
              href={`#${tabId}-panel`}
              label="Synthetic monitoring"
              aria-label="Synthetic monitoring"
              icon="check"
              active={selectedSource === 'synthetic'}
              aria-controls={`${tabId}-panel`}
              onChangeTab={(event) => {
                event.preventDefault();
                onChangeSource('synthetic');
              }}
              onKeyDown={handleRailKeyDown}
            />
            <VerticalTab
              ref={frontendTabRef}
              id={`${tabId}-frontend`}
              href={`#${tabId}-panel`}
              label="Frontend user data"
              aria-label="Frontend user data"
              icon="frontend-observability"
              active={selectedSource === 'frontend'}
              aria-controls={`${tabId}-panel`}
              onChangeTab={(event) => {
                event.preventDefault();
                onChangeSource('frontend');
              }}
              onKeyDown={handleRailKeyDown}
            />
          </div>
          <div
            id={`${tabId}-panel`}
            className={styles.viewContent}
            role="tabpanel"
            aria-labelledby={`${tabId}-${selectedSource}`}
            tabIndex={0}
          >
            {selectedSource === 'synthetic' ? (
              syntheticContent
            ) : (
              <Box paddingY={2}>
                <FrontendContext timepoint={timepoint} />
              </Box>
            )}
          </div>
        </div>
      </TabContent>
    </>
  );
};

interface ProbeNameTabProps {
  active: boolean;
  probeName: string;
  handleChangeTab?: () => void;
  handleMouseEnter?: () => void;
  handleMouseLeave?: () => void;
  status: TimepointStatus;
}

const ProbeNameTab = ({
  active,
  probeName,
  handleChangeTab,
  handleMouseEnter,
  handleMouseLeave,
  status,
}: ProbeNameTabProps) => {
  return (
    <Tab
      key={probeName}
      // @ts-expect-error - it accepts components despite its type
      label={
        <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Stack direction="row" alignItems="center">
            <div>{probeName}</div>
            <ProbeNameIcon status={status} />
          </Stack>
        </div>
      }
      active={active}
      onChangeTab={handleChangeTab}
    />
  );
};

const ICON_MAP: Record<TimepointStatus, IconName> = {
  pending: 'fa fa-spinner',
  success: 'check',
  failure: 'times',
  missing: 'question-circle',
};

const ProbeNameIcon = ({ status }: { status: TimepointStatus }) => {
  const vizOption = useTimepointVizOptions(status);

  return <Icon name={ICON_MAP[status]} color={vizOption.statusColor} />;
};

const MultipleExecutions = ({
  executions,
  logsView,
  from,
  to,
  probeName,
  timepoint,
  viewerExecutionIndex,
}: {
  executions: ExecutionLogs[];
  logsView: LogsView;
  from: number | string;
  to: number | string;
  probeName: string;
  timepoint: StatelessTimepoint;
  viewerExecutionIndex: number;
}) => {
  const styles = useStyles2(getStyles);
  const success = useTimepointVizOptions('success');
  const failure = useTimepointVizOptions('failure');
  const { handleViewerStateChange } = useTimepointExplorerContext();

  const handleSelectExecution = useCallback(
    (index: number) => {
      handleViewerStateChange([timepoint, probeName, index]);
    },
    [handleViewerStateChange, probeName, timepoint]
  );

  return (
    <Stack direction="column" gap={2}>
      <Alert title="Multiple executions" severity="info">
        {/* TODO: Add a list of reasons why this happened */}
        <div>This timepoint had multiple executions for this probe.</div>
      </Alert>
      <Stack direction="column" gap={4}>
        {executions.map((execution, index) => {
          const { probe_success } = execution[0].labels;
          const id = execution[0][LokiFieldNames.Id];
          const isSelected = viewerExecutionIndex === index;

          return (
            <React.Fragment key={id}>
              <div
                className={cx(styles.multipleExecutions, {
                  [styles.multipleExecutionsSelected]: isSelected,
                })}
              >
                <PlainButton className={styles.executionSelector} onClick={() => handleSelectExecution(index)}>
                  <Stack direction="column" gap={2} alignItems="center">
                    <div className={styles.executionIndex}>{index + 1}</div>
                    <Icon
                      name={probe_success === '1' ? 'check' : 'times'}
                      color={`${probe_success === '1' ? success.statusColor : failure.statusColor}`}
                    />
                  </Stack>
                </PlainButton>
                <LogsRenderer<UnknownExecutionLog>
                  logs={execution}
                  logsView={logsView}
                  mainKey="msg"
                  from={from}
                  to={to}
                />
              </div>
              {index !== executions.length - 1 && <div className={styles.divider} />}
            </React.Fragment>
          );
        })}
      </Stack>
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    railLayout: css`
      display: flex;
      align-items: stretch;
      min-width: 0;

      ${theme.breakpoints.down('sm')} {
        flex-direction: column;
      }
    `,
    rail: css`
      display: flex;
      flex: 0 0 190px;
      flex-direction: column;
      justify-content: flex-start;
      border-right: 1px solid ${theme.colors.border.weak};
      padding-top: ${theme.spacing(1)};

      > [role='tab'] {
        height: auto;
      }

      ${theme.breakpoints.down('sm')} {
        flex-basis: auto;
        border-right: 0;
        border-bottom: 1px solid ${theme.colors.border.weak};
      }
    `,
    viewContent: css`
      flex: 1;
      min-width: 0;
      padding-left: ${theme.spacing(2)};

      ${theme.breakpoints.down('sm')} {
        padding-left: 0;
      }
    `,
    multipleExecutions: css`
      display: grid;
      grid-template-columns: 50px 1fr;
      gap: ${theme.spacing(2)};
    `,
    multipleExecutionsSelected: css`
      outline: 2px solid ${theme.colors.primary.border};
      border-radius: ${theme.shape.radius.default};
    `,
    executionSelector: css`
      width: 100%;
    `,
    executionIndex: css`
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
      border: 1px solid ${theme.colors.border.medium};
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: auto;
    `,
    divider: css`
      border-bottom: 2px solid ${theme.colors.warning.border};
    `,
  };
};
