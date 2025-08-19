import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css, cx, keyframes } from '@emotion/css';

interface ChunkyLoadingBarProps {
  className?: string;
  direction?: 'vertical' | 'horizontal';
  height: number;
  width: number;
  color: string;
}

const BAR_HEIGHT_PERCENT = 28;
const BAR_WIDTH_PERCENT = 28;
const MILLISECONDS_PER_PIXEL = 2.4;
const MIN_DURATION_MS = 2000;
const MAX_DURATION_MS = 4000;
const DEFAULT_ANIMATION_DELAY = 300;
const MAX_TRANSLATE_Y = (100 / BAR_HEIGHT_PERCENT) * 100;
const MAX_TRANSLATE_X = (100 / BAR_WIDTH_PERCENT) * 100;

export const ChunkyLoadingBar = ({
  className,
  direction = 'vertical',
  height,
  width,
  color,
}: ChunkyLoadingBarProps) => {
  const pxToUse = direction === 'vertical' ? height : width;
  const durationMs = Math.min(Math.max(Math.round(pxToUse * MILLISECONDS_PER_PIXEL), MIN_DURATION_MS), MAX_DURATION_MS);
  const styles = useStyles2(getStyles, direction, width, height, color, durationMs);

  return (
    <div className={cx(styles.container, className)}>
      <div className={styles.chunkyLoadingBar} />
    </div>
  );
};

const getStyles = (
  theme: GrafanaTheme2,
  direction: 'vertical' | 'horizontal',
  width: number,
  height: number,
  color: string,
  duration: number
) => {
  const verticalAnimation = keyframes({
    '0%': {
      transform: 'translateY(-100%)',
    },
    // this gives us a delay between iterations
    '85%, 100%': {
      transform: `translateY(${MAX_TRANSLATE_Y}%)`,
    },
  });

  const horizontalAnimation = keyframes({
    '0%': {
      transform: 'translateX(-100%)',
    },
    '85%, 100%': {
      transform: `translateX(${MAX_TRANSLATE_X}%)`,
    },
  });

  const animation = direction === 'vertical' ? verticalAnimation : horizontalAnimation;
  const renderedHeight = direction === 'vertical' ? BAR_HEIGHT_PERCENT + '%' : height;
  const renderedWidth = direction === 'horizontal' ? BAR_WIDTH_PERCENT + '%' : width;
  const background =
    direction === 'vertical'
      ? `linear-gradient(180deg, transparent 0%, ${color} 80.75%, transparent 100%)`
      : `linear-gradient(90deg, transparent 0%, ${color} 80.75%, transparent 100%)`;

  const transform = direction === 'vertical' ? 'translateY(-100%)' : 'translateX(-100%)';

  return {
    container: css`
      width: ${width}px;
      height: ${height}px;
      position: relative;
      overflow: hidden;
    `,
    chunkyLoadingBar: css({
      position: 'absolute',
      top: 0,
      left: 0,
      width: renderedWidth,
      height: renderedHeight,
      background,
      transform,
      willChange: 'transform',
      [theme.transitions.handleMotion('no-preference')]: {
        animationName: animation,
        animationDelay: `${DEFAULT_ANIMATION_DELAY}ms`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDuration: `${duration}ms`,
      },
      [theme.transitions.handleMotion('reduce')]: {
        animationName: animation,
        animationDelay: `${DEFAULT_ANIMATION_DELAY}ms`,
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
        animationDuration: `${4 * duration}ms`,
      },
    }),
  };
};
