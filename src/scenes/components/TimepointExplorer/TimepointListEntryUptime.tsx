import React, { useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, styleMixins, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { PlainButton } from 'components/PlainButton';
import { TIMEPOINT_GAP_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryTooltip } from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface TimepointListEntryProps {
  timepoint: StatelessTimepoint;
}

const GLOBAL_CLASS = `uptime_bar`;

export const TimepointListEntryUptime = ({ timepoint }: TimepointListEntryProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const { handleSelectedTimepointChange, maxProbeDuration, selectedTimepoint, vizDisplay, timepointWidth } =
    useTimepointExplorerContext();

  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const styles = useStyles2(getStyles, timepointWidth);
  const executionToView = statefulTimepoint.executions[0]?.id;
  const isSelected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime;
  const ref = useRef<HTMLButtonElement>(null);
  const state =
    statefulTimepoint.uptimeValue === 0 ? 'failure' : statefulTimepoint.uptimeValue === 1 ? 'success' : 'unknown';

  if (!vizDisplay.includes(state)) {
    return <div />;
  }

  return (
    <div className={styles.container} style={{ height: `${height}%` }}>
      {isSelected && (
        <div className={styles.selectedIcon} style={{ bottom: `${height}%` }}>
          <Icon name="eye" />
        </div>
      )}
      <Tooltip content={<TimepointListEntryTooltip timepoint={timepoint} />} ref={ref} interactive placement="top">
        <PlainButton
          className={styles.uptimeButton}
          ref={ref}
          onClick={() => handleSelectedTimepointChange(timepoint, executionToView)}
          showFocusStyles={false}
        >
          <TimepointVizItem
            className={cx(styles.uptimeBar, GLOBAL_CLASS, {
              [styles.selected]: isSelected,
            })}
            state={state}
          >
            {statefulTimepoint.uptimeValue === 0 ? (
              <Icon name={`times`} />
            ) : statefulTimepoint.uptimeValue === 1 ? (
              <Icon name={`check`} />
            ) : (
              `?`
            )}
          </TimepointVizItem>
        </PlainButton>
      </Tooltip>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => {
  return {
    container: css`
      display: flex;
      flex-direction: column;
      align-items: center;
    `,
    uptimeButton: css`
      width: calc(${timepointWidth}px + ${TIMEPOINT_GAP_PX}px);
      height: 100%;
      left: 50%;
      transform: translateX(-50%);
      position: relative;
      display: flex;
      justify-content: center;

      &:hover .${GLOBAL_CLASS} {
        &:after {
          opacity: 0.3;
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
      min-height: 2px;
      width: ${timepointWidth}px;
      display: flex;
      align-items: end;
      justify-content: center;
      position: relative;
      border-radius: ${theme.shape.radius.default};

      &:after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${theme.colors.getContrastText(theme.colors.background.primary, 0.1)};
        opacity: 0;
        pointer-events: none;
      }
    `,
    selected: css`
      border-width: 2px;
      z-index: 1;
    `,
    selectedIcon: css`
      position: absolute;
      bottom: 100%;
    `,
  };
};
