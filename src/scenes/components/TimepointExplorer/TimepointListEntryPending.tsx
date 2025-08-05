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

const GLOBAL_CLASS = `pending_bar`;

export const TimepointListEntryPending = ({ timepoint }: TimepointListEntryProps) => {
  const statefulTimepoint = {
    ...useStatefulTimepoint(timepoint),
    uptimeValue: 2,
  } as const;

  const { handleSelectedTimepointChange, maxProbeDuration, selectedTimepoint, timepointWidth, vizDisplay } =
    useTimepointExplorerContext();

  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const styles = useStyles2(getStyles, timepointWidth);
  const executionToView = statefulTimepoint.executions[0]?.id;
  const isSelected = selectedTimepoint[0]?.adjustedTime === timepoint.adjustedTime;
  const ref = useRef<HTMLButtonElement>(null);

  if (!vizDisplay.includes(`pending`)) {
    return <div />;
  }

  return (
    <div style={{ height: `${height}%`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isSelected && (
        <div className={styles.selectedIcon} style={{ bottom: `${height}%` }}>
          <Icon name="eye" />
        </div>
      )}
      <Tooltip content={<TimepointListEntryTooltip timepoint={timepoint} />} ref={ref} interactive placement="top">
        <PlainButton
          className={styles.pendingButton}
          ref={ref}
          onClick={() => handleSelectedTimepointChange(timepoint, executionToView)}
          showFocusStyles={false}
        >
          <TimepointVizItem
            className={cx(styles.pendingBar, GLOBAL_CLASS, {
              [styles.selected]: isSelected,
            })}
            state={`pending`}
          >
            <Icon name={`fa fa-spinner`} />
          </TimepointVizItem>
        </PlainButton>
      </Tooltip>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => {
  return {
    pendingButton: css`
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
    pendingBar: css`
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
