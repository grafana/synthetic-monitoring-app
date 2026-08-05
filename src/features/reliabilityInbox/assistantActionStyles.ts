import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export const ASSISTANT_GRADIENT = 'linear-gradient(90deg, rgb(168, 85, 247), rgb(249, 115, 22))';
export const ASSISTANT_ACTION_SIZE = 'md' as const;

export function getAssistantActionStyle(theme: GrafanaTheme2) {
  const baseBackground = theme.colors.secondary.main;
  const elevatedBackground = theme.colors.emphasize(baseBackground, 0.05);
  const underlyingColor = theme.colors.background.canvas;
  const borderWidth = 1;
  const outerRadius = theme.shape.radius.default;
  const innerRadius = `max(calc(${outerRadius} - ${borderWidth}px), 1px)`;

  return css({
    label: 'reliability-inbox-assistant-action',
    width: 'fit-content',
    maxWidth: '100%',
    position: 'relative',
    isolation: 'isolate',
    border: 'none',
    background: 'none',
    color: theme.colors.text.primary,
    transition: 'box-shadow 0.1s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: outerRadius,
      cornerShape: 'squircle',
      background: ASSISTANT_GRADIENT,
      zIndex: -2,
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: borderWidth,
      borderRadius: innerRadius,
      cornerShape: 'squircle',
      background: `linear-gradient(${baseBackground}, ${baseBackground}), ${underlyingColor}`,
      zIndex: -1,
      pointerEvents: 'none',
    },
    '&:hover::after': {
      background: `linear-gradient(${elevatedBackground}, ${elevatedBackground}), ${underlyingColor}`,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.primary.border}`,
      outlineOffset: 2,
    },
    '&:disabled, &[aria-disabled="true"]': {
      cursor: 'not-allowed',
      opacity: 0.55,
    },
    '& > span': {
      color: `${theme.colors.text.primary} !important`,
    },
  });
}
