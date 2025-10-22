import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function getBodySmallStyles(theme: GrafanaTheme2) {
  return css`
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
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

// a11y class for hiding elements visually, whilst keeping the element for screen readers.
export const visuallyHidden = css`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;
