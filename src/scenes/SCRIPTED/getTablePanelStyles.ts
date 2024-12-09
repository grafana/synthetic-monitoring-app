import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function getTablePanelStyles(theme: GrafanaTheme2) {
  return {
    container: css`
      border: 1px solid ${theme.components.panel.borderColor};
      width: 100%;
      border-radius: ${theme.shape.radius.default};
    `,
    title: css`
      label: panel-title;
      display: block;
      margin-bottom: 0; /* override default h6 margin-bottom */
      padding: ${theme.spacing(theme.components.panel.padding)};
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      font-size: ${theme.typography.h6.fontSize};
      font-weight: ${theme.typography.h6.fontWeight};
    `,
    headerContainer: css`
      label: panel-header;
      display: flex;
      align-items: center;
    `,
    noDataContainer: css`
      padding: ${theme.spacing(4)};
      display: flex;
      flex-direction: column;
      align-items: center;
    `,
    table: css`
      & > div {
        display: flex;
      }
    `,
  };
}
