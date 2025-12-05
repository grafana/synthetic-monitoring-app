import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

// Prism token color styles for syntax highlighting
function getPrismTokenStyles(theme: GrafanaTheme2) {
  return {
    '.token.boolean, .token.string': {
      color: theme.colors.success.text,
    },
    '.token.constant': {
      color: theme.colors.info.text,
    },
    '.token.function': {
      color: theme.colors.text.primary,
    },
    '.token.punctuation': {
      color: theme.colors.text.secondary,
    },
    '.token.keyword': {
      color: theme.colors.info.text,
    },
    '.token.number': {
      color: theme.colors.success.text,
    },
    '.token.operator': {
      color: theme.colors.text.secondary,
      backgroundColor: 'transparent',
    },
    '.token.comment': {
      color: theme.colors.text.disabled,
    },
    '.token.property': {
      color: theme.colors.info.text,
    },
  };
}

export function getPrismCodeStyle(theme: GrafanaTheme2) {
  return css({
    display: 'block',
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    fontSize: 12,
    lineHeight: 1.5,
    padding: theme.spacing(2),
    whiteSpace: 'pre',
    color: theme.colors.text.primary,
    ...getPrismTokenStyles(theme),
  });
}

export function getPrismCodeStyles(theme: GrafanaTheme2) {
  return {
    pre: css({
      margin: 0,
      padding: 0,
      backgroundColor: 'transparent',
    }),
    code: getPrismCodeStyle(theme),
  };
}
