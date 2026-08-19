import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const ASSISTANT_GRADIENT = 'linear-gradient(90deg, rgb(168, 85, 247), rgb(249, 115, 22))';

export function getAssistantActionStyle(theme: GrafanaTheme2) {
  const baseBackground = theme.colors.secondary.main;
  const elevatedBackground = theme.colors.emphasize(baseBackground, 0.05);
  const underlyingColor = theme.colors.background.canvas;
  const outerRadius = theme.shape.radius.default;

  return css({
    label: 'reliability-inbox-assistant-action',
    width: 'fit-content',
    maxWidth: '100%',
    position: 'relative',
    isolation: 'isolate',
    border: 'none',
    background: 'none',
    color: theme.colors.text.primary,
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: outerRadius,
      background: ASSISTANT_GRADIENT,
      zIndex: -2,
      pointerEvents: 'none',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 1,
      borderRadius: `calc(${outerRadius} - 1px)`,
      background: `linear-gradient(${baseBackground}, ${baseBackground}), ${underlyingColor}`,
      zIndex: -1,
      pointerEvents: 'none',
    },
    '&:hover::after': {
      background: `linear-gradient(${elevatedBackground}, ${elevatedBackground}), ${underlyingColor}`,
    },
    '& > span': {
      color: `${theme.colors.text.primary} !important`,
    },
  });
}
