import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Stack, Tooltip, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { PlainButton } from 'components/PlainButton';
import { TIMEPOINT_SIZE } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  SelectedTimepointState,
  Timepoint,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointListEntryProps {
  timepoint: Timepoint;
  maxProbeDurationData: number;
  viewMode: ViewMode;
  selectedTimepoint: SelectedTimepointState;
  handleTimepointSelection: (timepoint: Timepoint, probeToView: string) => void;
}

export const TimepointListEntry = ({
  timepoint,
  maxProbeDurationData,
  viewMode,
  selectedTimepoint,
  handleTimepointSelection,
}: TimepointListEntryProps) => {
  const styles = getStyles(useTheme2());

  return (
    <div className={styles.timepoint}>
      <Entry
        maxProbeDurationData={maxProbeDurationData}
        timepoint={timepoint}
        viewMode={viewMode}
        selectedTimepoint={selectedTimepoint}
        handleTimepointSelection={handleTimepointSelection}
      />
    </div>
  );
};

const Entry = (props: TimepointListEntryProps) => {
  if (props.viewMode === 'uptime') {
    return <UptimeEntry {...props} />;
  }

  return <ReachabilityEntry {...props} />;
};

const ICON_MAP: Record<number, IconName> = {
  [-1]: 'question-circle',
  [0]: 'times',
  [1]: 'check',
};

const UptimeEntry = ({
  maxProbeDurationData,
  timepoint,
  selectedTimepoint,
  handleTimepointSelection,
}: TimepointListEntryProps) => {
  const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);
  const styles = getStyles(useTheme2());
  const isSuccess = timepoint.uptimeValue === 1;
  const isFailure = timepoint.uptimeValue === 0;
  const probeToView = timepoint.probes[0]?.[LokiFieldNames.Labels].probe;
  const isSelected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime;

  return (
    <Tooltip content={<TimepointTooltipContent timepoint={timepoint} value={`${timepoint.maxProbeDuration}ms`} />}>
      <div style={{ height: `${height}%` }}>
        <PlainButton
          className={cx(styles.uptimeButton, {
            [styles.success]: isSuccess,
            [styles.failure]: isFailure,
            [styles.selected]: isSelected,
          })}
          onClick={() => handleTimepointSelection(timepoint, probeToView)}
        >
          <Icon name={ICON_MAP[timepoint.uptimeValue]} />
        </PlainButton>
      </div>
    </Tooltip>
  );
};

const ReachabilityEntry = ({
  maxProbeDurationData,
  timepoint,
  handleTimepointSelection,
  selectedTimepoint,
}: TimepointListEntryProps) => {
  const styles = getStyles(useTheme2());
  const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);

  return (
    <Tooltip content={<TimepointTooltipContent timepoint={timepoint} value={`${``}ms`} />}>
      <div className={styles.reachabilityEntry} style={{ height: `calc(${height}% + ${TIMEPOINT_SIZE}px)` }}>
        {timepoint.probes.map((probeValue) => {
          const duration = Number(probeValue[LokiFieldNames.Labels].duration_seconds) * 1000;
          const height = getEntryHeight(duration, maxProbeDurationData);
          const probeSuccess = probeValue[LokiFieldNames.Labels].probe_success;
          const probeName = probeValue[LokiFieldNames.Labels].probe;
          const isSuccess = probeSuccess === '1';
          const isFailure = probeSuccess === '0';
          const isTimepointSelected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime;
          const isProbeSelected = probeName === selectedTimepoint[1];

          return (
            <PlainButton
              className={cx(styles.reachabilityProbe, {
                [styles.success]: isSuccess,
                [styles.failure]: isFailure,
                [styles.selected]: isTimepointSelected && isProbeSelected,
              })}
              key={probeValue[LokiFieldNames.Labels].probe}
              style={{ bottom: `${height}%` }}
              onClick={() => handleTimepointSelection(timepoint, probeName)}
            >
              <Icon name={ICON_MAP[probeSuccess]} />
            </PlainButton>
          );
        })}
      </div>
    </Tooltip>
  );
};

const TimepointTooltipContent = ({ timepoint, value }: { timepoint: Timepoint; value: string }) => {
  const displayTime = new Date(timepoint.adjustedTime).toLocaleString();

  return (
    <Stack direction={`column`}>
      <div>{timepoint.timepointDuration}</div>
      <div>{timepoint.frequency}</div>
      <div>{timepoint.index}</div>
      <div>{displayTime}</div>
      <div>{value}</div>
      {timepoint.probes.map((probe) => {
        return (
          <div key={probe[LokiFieldNames.Labels].probe}>
            {probe[LokiFieldNames.Labels].probe} - {probe[LokiFieldNames.Labels].probe_success}
          </div>
        );
      })}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timepoint: css`
    display: flex;
    justify-content: end;
    flex-direction: column;
    width: ${TIMEPOINT_SIZE}px;
    height: 100%;
    position: relative;
  `,
  uptimeButton: css`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: end;
    justify-content: center;
  `,
  reachabilityEntry: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    width: 100%;
  `,
  success: css`
    background-color: ${theme.colors.success.shade};
  `,
  failure: css`
    background-color: ${theme.colors.error.shade};
    z-index: 1;
  `,
  selected: css`
    background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
    z-index: 1;
  `,
  reachabilityProbe: css`
    position: absolute;
    width: ${TIMEPOINT_SIZE}px;
    height: ${TIMEPOINT_SIZE}px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transform: translateY(50%);

    &:hover {
      background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
      z-index: 1;
    }
  `,
});
