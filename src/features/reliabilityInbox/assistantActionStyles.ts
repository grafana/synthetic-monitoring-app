import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

const ASSISTANT_GRADIENT = 'linear-gradient(90deg, rgb(168, 85, 247), rgb(249, 115, 22))';

export function getAssistantActionStyle(theme: GrafanaTheme2) {
  const baseBackground = theme.colors.secondary.main;

  return css({
    label: 'reliability-inbox-assistant-action',
    width: 'fit-content',
    maxWidth: '100%',
    border: '1px solid transparent',
    background: `linear-gradient(${baseBackground}, ${baseBackground}) padding-box, ${ASSISTANT_GRADIENT} border-box`,
    color: theme.colors.text.primary,
    '& > span': {
      color: `${theme.colors.text.primary} !important`,
    },
  });
}
