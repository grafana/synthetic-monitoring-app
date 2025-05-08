import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, Stack, Tooltip, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { TIMEPOINT_SIZE } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Timepoint, ViewMode } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointListEntryProps {
  timepoint: Timepoint;
  maxProbeDurationData: number;
  viewMode: ViewMode;
}

export const TimepointListEntry = ({ timepoint, maxProbeDurationData, viewMode }: TimepointListEntryProps) => {
  const styles = getStyles(useTheme2());

  return (
    <div className={styles.timepoint}>
      <Entry maxProbeDurationData={maxProbeDurationData} timepoint={timepoint} viewMode={viewMode} />
    </div>
  );
};

const Entry = ({
  maxProbeDurationData,
  timepoint,
  viewMode,
}: {
  maxProbeDurationData: number;
  timepoint: Timepoint;
  viewMode: ViewMode;
}) => {
  if (viewMode === 'uptime') {
    return <UptimeEntry maxProbeDurationData={maxProbeDurationData} timepoint={timepoint} />;
  }

  return <ReachabilityEntry maxProbeDurationData={maxProbeDurationData} timepoint={timepoint} />;
};

const ICON_MAP: Record<number, IconName> = {
  [-1]: 'question-circle',
  [0]: 'times',
  [1]: 'check',
};

const UptimeEntry = ({ maxProbeDurationData, timepoint }: { maxProbeDurationData: number; timepoint: Timepoint }) => {
  const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);
  const styles = getStyles(useTheme2());
  const isSuccess = timepoint.uptimeValue === 1;
  const isFailure = timepoint.uptimeValue === 0;

  return (
    <Tooltip content={<TimepointTooltipContent timepoint={timepoint} value={`${timepoint.maxProbeDuration}ms`} />}>
      <div
        className={cx(styles.uptimeEntry, {
          [styles.success]: isSuccess,
          [styles.failure]: isFailure,
        })}
        style={{ height: `${height}%` }}
      >
        <Icon name={ICON_MAP[timepoint.uptimeValue]} />
      </div>
    </Tooltip>
  );
};

const ReachabilityEntry = ({
  maxProbeDurationData,
  timepoint,
}: {
  maxProbeDurationData: number;
  timepoint: Timepoint;
}) => {
  const styles = getStyles(useTheme2());
  const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);

  return (
    <Tooltip content={<TimepointTooltipContent timepoint={timepoint} value={`${``}ms`} />}>
      <div className={styles.reachabilityEntry} style={{ height: `calc(${height}% + ${TIMEPOINT_SIZE}px)` }}>
        {timepoint.probes.map((probeValue) => {
          const duration = Number(probeValue[LokiFieldNames.Labels].duration_seconds) * 1000;
          const height = getEntryHeight(duration, maxProbeDurationData);
          const probeSuccess = probeValue[LokiFieldNames.Labels].probe_success;
          const isSuccess = probeSuccess === '1';
          const isFailure = probeSuccess === '0';

          return (
            <div
              className={cx(styles.reachabilityProbe, {
                [styles.success]: isSuccess,
                [styles.failure]: isFailure,
              })}
              key={probeValue[LokiFieldNames.Labels].probe}
              style={{ bottom: `${height}%` }}
            >
              <Icon name={ICON_MAP[probeSuccess]} />
            </div>
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
  uptimeEntry: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: end;
    width: 100%;
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
