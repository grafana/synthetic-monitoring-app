import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function getBodySmallStyles(theme: GrafanaTheme2) {
  return css`
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
  `;
}

export function getInputFocusStyles(theme: GrafanaTheme2) {
  return css`
    &:focus {
      outline: 2px dotted transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main};
      transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
      transition-duration: 0.2s;
      transition-property: outline, outline-offset, box-shadow;
    }
  `;
}

export function codeSnippetWrapper(theme: GrafanaTheme2) {
  return css`
    // Handle code snippet border
    & > div,
    & > div > div {
      border: none;
    }

    // Change code snippet menu background
    & section > div > div {
      background-color: ${theme.colors.background.primary};
    }
  `;
}
