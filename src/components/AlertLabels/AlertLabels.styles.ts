import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export const getStyles = (theme: GrafanaTheme2) => ({
  grid: css`
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    grid-column-gap: ${theme.spacing(2)};
    grid-row-gap: ${theme.spacing(1)};
  `,
  addButton: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  helpText: css`
    font-size: ${theme.typography.bodySmall.fontSize};
  `,
});
