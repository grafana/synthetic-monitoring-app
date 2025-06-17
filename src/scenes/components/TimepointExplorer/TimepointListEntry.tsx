import React, { useRef, useState } from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Icon, styleMixins, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { PlainButton } from 'components/PlainButton';
import {
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
  TIMEPOINT_THEME_HEIGHT_PX,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  Annotation,
  CheckEventType,
  SelectedTimepointState,
  Timepoint,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryTooltip } from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip';

interface TimepointListEntryProps {
  annotations: Annotation[];
  handleTimepointSelection: (timepoint: Timepoint, probeToView: string) => void;
  maxProbeDurationData: number;
  selectedTimepoint: SelectedTimepointState;
  timepoint: Timepoint;
  viewIndex: number;
  viewMode: ViewMode;
}

export const TimepointListEntry = ({
  annotations,
  timepoint,
  maxProbeDurationData,
  viewMode,
  selectedTimepoint,
  handleTimepointSelection,
  viewIndex,
}: TimepointListEntryProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.timepoint}>
      <Entry
        annotations={annotations}
        handleTimepointSelection={handleTimepointSelection}
        maxProbeDurationData={maxProbeDurationData}
        selectedTimepoint={selectedTimepoint}
        timepoint={timepoint}
        viewIndex={viewIndex}
        viewMode={viewMode}
      />
    </div>
  );
};

const Entry = (props: TimepointListEntryProps) => {
  const isCheckCreatedEntry = props.annotations.some(
    (annotation) =>
      annotation.timepointStart.adjustedTime === props.timepoint.adjustedTime &&
      annotation.checkEvent.label === CheckEventType.CHECK_CREATED
  );

  const hasResult = props.timepoint.uptimeValue !== -1;
  const isFirstEntryWithoutResult = props.timepoint.index === 0 && !hasResult;

  if (isCheckCreatedEntry || isFirstEntryWithoutResult) {
    return <div data-testid={`empty-timepoint-${props.timepoint.index}`} />;
  }

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

const GLOBAL_CLASS = `uptime_bar`;

const UptimeEntry = ({
  maxProbeDurationData,
  timepoint,
  selectedTimepoint,
  handleTimepointSelection,
  viewIndex,
}: TimepointListEntryProps) => {
  const height = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);
  const styles = useStyles2(getStyles);
  const isSuccess = timepoint.uptimeValue === 1;
  const isFailure = timepoint.uptimeValue === 0;
  const probeToView = timepoint.probes[0]?.[LokiFieldNames.Labels].probe;
  const isSelected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime;
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ height: `${height}%` }}>
      <Tooltip content={<TimepointListEntryTooltip timepoint={timepoint} />} ref={ref} interactive>
        <PlainButton
          className={styles.uptimeButton}
          ref={ref}
          onClick={() => handleTimepointSelection(timepoint, probeToView)}
          style={viewIndex === 0 ? { paddingLeft: 0 } : undefined}
          showFocusStyles={false}
        >
          <div
            className={cx(styles.uptimeBar, GLOBAL_CLASS, {
              [styles.success]: isSuccess,
              [styles.failure]: isFailure,
              [styles.selected]: isSelected,
              [styles.successSelected]: isSuccess && isSelected,
              [styles.failureSelected]: isFailure && isSelected,
            })}
          >
            <Icon name={ICON_MAP[timepoint.uptimeValue]} color={`white`} />
          </div>
        </PlainButton>
      </Tooltip>
    </div>
  );
};

const ReachabilityEntry = ({
  maxProbeDurationData,
  timepoint,
  handleTimepointSelection,
  selectedTimepoint,
}: TimepointListEntryProps) => {
  const styles = useStyles2(getStyles);
  const entryHeight = getEntryHeight(timepoint.maxProbeDuration, maxProbeDurationData);
  const [hoveredCheck, setHoveredCheck] = useState<string | null>(null);

  // add the timepoint size to the height so the entries are rendered in the middle of the Y Axis line
  const height = `calc(${entryHeight}% + ${TIMEPOINT_SIZE}px)`;

  return (
    <Tooltip content={<TimepointListEntryTooltip timepoint={timepoint} hoveredCheck={hoveredCheck} />} interactive>
      <div className={styles.reachabilityEntry} style={{ height }}>
        {timepoint.probes.map((checkValue) => {
          const duration = Number(checkValue[LokiFieldNames.Labels].duration_seconds) * 1000;
          const height = getEntryHeight(duration, maxProbeDurationData);
          const pixelHeight = TIMEPOINT_THEME_HEIGHT_PX * (height / 100);
          const probeSuccess = checkValue[LokiFieldNames.Labels].probe_success;
          const checkId = checkValue.id;
          const isSuccess = probeSuccess === '1';
          const isFailure = probeSuccess === '0';
          const [timepointToView, checkToView] = selectedTimepoint;
          const isTimepointSelected = timepointToView?.adjustedTime === timepoint.adjustedTime;
          const isProbeSelected = checkId === checkToView;
          const isSelected = isTimepointSelected && isProbeSelected;

          return (
            <PlainButton
              className={cx(styles.reachabilityProbe, {
                [styles.success]: isSuccess,
                [styles.failure]: isFailure,
                [styles.selected]: isSelected,
                [styles.successSelected]: isSuccess && isSelected,
                [styles.failureSelected]: isFailure && isSelected,
              })}
              key={checkId}
              style={{ bottom: `${pixelHeight}px` }}
              onClick={() => handleTimepointSelection(timepoint, checkId)}
              onMouseEnter={() => setHoveredCheck(checkId)}
              onMouseLeave={() => setHoveredCheck(null)}
            >
              <Icon name={ICON_MAP[probeSuccess]} color={`white`} />
            </PlainButton>
          );
        })}
      </div>
    </Tooltip>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    timepoint: css`
      display: flex;
      justify-content: end;
      flex-direction: column;
      width: ${TIMEPOINT_SIZE}px;
      height: 100%;
      position: relative;
    `,
    uptimeButton: css`
      width: calc(${TIMEPOINT_SIZE}px + ${TIMEPOINT_GAP_PX}px);
      height: 100%;
      left: 50%;
      transform: translateX(-50%);
      position: relative;
      display: flex;
      justify-content: center;

      &:hover {
        .${GLOBAL_CLASS} {
          // todo: work out why this needs a global class?
          background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
        }
      }

      &:focus-visible {
        .${GLOBAL_CLASS} {
          ${styleMixins.getFocusStyles(theme)}
        }
      }
    `,
    uptimeBar: css`
      height: 100%;
      width: ${TIMEPOINT_SIZE}px;
      display: flex;
      align-items: end;
      justify-content: center;
      position: relative;
      border-radius: ${theme.shape.radius.default};
    `,
    reachabilityEntry: css`
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: end;
      width: ${TIMEPOINT_SIZE + TIMEPOINT_GAP_PX}px;
      position: relative;
      left: 50%;
      transform: translateX(-50%);
    `,
    success: css`
      background-color: ${theme.colors.success.shade};
    `,
    failure: css`
      background-color: ${theme.colors.error.shade};
    `,
    successSelected: css`
      background-color: ${theme.colors.success.main};
      border: 1px solid ${theme.colors.success.border};
    `,
    failureSelected: css`
      background-color: ${theme.colors.error.main};
      border: 1px solid ${theme.colors.error.border};
    `,
    selected: css`
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
  };
};
