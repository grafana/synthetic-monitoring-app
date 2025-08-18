import React, { useRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, styleMixins, Tooltip, useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

import { PlainButton } from 'components/PlainButton';
import { TIMEPOINT_GAP_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeight } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryTooltip } from 'scenes/components/TimepointExplorer/TimepointListEntryTooltip';
import { TimepointVizItem } from 'scenes/components/TimepointExplorer/TimepointVizItem';

interface TimepointListEntryPendingProps {
  timepoint: StatelessTimepoint;
  pendingProbeNames?: string[];
}

const GLOBAL_CLASS = `pending_bar`;

// Loading animation constants
const BAR_HEIGHT_PERCENT = 28;
const MILLISECONDS_PER_PIXEL = 2.4;
const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 4000;
const DEFAULT_ANIMATION_DELAY = 300;
const MAX_TRANSLATE_Y = (100 / BAR_HEIGHT_PERCENT) * 100;

export const TimepointListEntryPending = ({ timepoint, pendingProbeNames }: TimepointListEntryPendingProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);

  const { handleSelectedStateChange, maxProbeDuration, selectedState, timepointWidth, vizDisplay, vizOptions } =
    useTimepointExplorerContext();
  const option = vizOptions.pending;

  const height = getEntryHeight(statefulTimepoint.maxProbeDuration, maxProbeDuration);
  const durationMs = Math.min(Math.max(Math.round(height * MILLISECONDS_PER_PIXEL), MIN_DURATION_MS), MAX_DURATION_MS);
  const styles = useStyles2(getStyles, timepointWidth, option, durationMs);
  const probeNameToView = Object.keys(statefulTimepoint.probeResults)[0] || pendingProbeNames?.[0] || ``;
  const [selectedTimepoint] = selectedState;
  const isSelected = selectedTimepoint?.adjustedTime === timepoint.adjustedTime;
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
          onClick={() => handleSelectedStateChange([timepoint, probeNameToView, 0])}
          showFocusStyles={false}
        >
          <TimepointVizItem
            className={cx(styles.pendingBar, GLOBAL_CLASS, {
              [styles.selected]: isSelected,
            })}
            status={`pending`}
          >
            <div className={styles.loadingBar} />
          </TimepointVizItem>
        </PlainButton>
      </Tooltip>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number, option: string, duration: number) => {
  const verticalAnimation = keyframes({
    '0%': {
      transform: 'translateY(-100%)',
    },
    // this gives us a delay between iterations
    '85%, 100%': {
      transform: `translateY(${MAX_TRANSLATE_Y}%)`,
    },
  });
  return {
    pendingButton: css`
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
    pendingBar: css`
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
    loadingBar: css({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: BAR_HEIGHT_PERCENT + '%',
      background: `linear-gradient(180deg, transparent 0%, ${option} 80.75%, transparent 100%)`,
      transform: 'translateY(-100%)',
      willChange: 'transform',
      [theme.transitions.handleMotion('no-preference')]: {
        animationName: verticalAnimation,
        animationDelay: `${DEFAULT_ANIMATION_DELAY}ms`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDuration: `${duration}ms`,
      },
      [theme.transitions.handleMotion('reduce')]: {
        animationName: verticalAnimation,
        animationDelay: `${DEFAULT_ANIMATION_DELAY}ms`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDuration: `${4 * duration}ms`,
      },
    }),
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
