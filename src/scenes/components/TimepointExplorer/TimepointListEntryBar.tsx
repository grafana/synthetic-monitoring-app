import React, { ReactNode, useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, styleMixins, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { PlainButton } from 'components/PlainButton';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { TIMEPOINT_GAP_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint, TimepointStatus } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryTooltip } from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface TimepointListEntryPendingProps {
  children: ReactNode;
  timepoint: StatelessTimepoint;
  status: TimepointStatus;
}

const GLOBAL_CLASS = `list_entry_bar`;

export const TimepointListEntryBar = ({ children, timepoint, status }: TimepointListEntryPendingProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);

  const { check, handleSelectedStateChange, maxProbeDuration, selectedState, timepointWidth, vizDisplay } =
    useTimepointExplorerContext();
  const probeVar = useSceneVarProbes(check);

  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const styles = useStyles2(getStyles, timepointWidth, height);
  const probeNameToView = probeVar[0];
  const [selectedTimepoint] = selectedState;
  const isSelected = selectedTimepoint?.adjustedTime === timepoint.adjustedTime;
  const ref = useRef<HTMLButtonElement>(null);

  if (!vizDisplay.includes(status)) {
    return <div />;
  }

  return (
    <div className={styles.container}>
      {isSelected && (
        <div className={styles.selectedIcon}>
          <Icon name="eye" />
        </div>
      )}
      <Tooltip content={<TimepointListEntryTooltip timepoint={timepoint} />} ref={ref} interactive placement="top">
        <PlainButton
          className={styles.button}
          ref={ref}
          onClick={() => handleSelectedStateChange([timepoint, probeNameToView, 0])}
          showFocusStyles={false}
        >
          <TimepointVizItem
            className={cx(styles.bar, GLOBAL_CLASS, {
              [styles.selected]: isSelected,
            })}
            status={status}
          >
            {children}
          </TimepointVizItem>
        </PlainButton>
      </Tooltip>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number, height: number) => {
  return {
    container: css`
      height: ${height}%;
      display: flex;
      flex-direction: column;
      align-items: center;
    `,
    button: css`
      width: calc(${timepointWidth}px + ${TIMEPOINT_GAP_PX}px);
      height: 100%;
      left: 50%;
      transform: translateX(-50%);
      position: relative;
      display: flex;
      justify-content: center;
      z-index: 2;

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
    bar: css`
      height: 100%;
      min-height: 2px;
      width: ${timepointWidth}px;
      display: flex;
      align-items: end;
      justify-content: center;
      position: relative;
      border-radius: ${theme.shape.radius.default};
      overflow: hidden;

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
      bottom: ${height}%;
    `,
  };
};
