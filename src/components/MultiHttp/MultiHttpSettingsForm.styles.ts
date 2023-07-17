import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export const getMultiHttpFormStyles = (theme: GrafanaTheme2) => ({
  request: css`
    display: flex;
    flex-direction: column;
    margin-top: 15px;
    justify-content: space-evenly;
    gap: ${theme.spacing(1)};
    align-self: flex-start;
    align-items: content;
    position: relative;
  `,
  collapseTarget: css`
    background-color: ${theme.colors.background.secondary};
    max-height: 100%;
  `,
  jobNameInput: css`
    width: 100%;
  `,
  reqMethod: css`
    align-self: flex-start;
  `,
  formBody: css`
    margin-bottom: ${theme.spacing(1, 2)};
  `,
  breakLine: css`
    margin-top: ${theme.spacing('lg')};
  `,
  tabsContent: css`
    min-height: 75px;
    margin-bottom: 15px;
    width: 100%;
  `,
  tabsBar: css`
    margin-top: -10px;
    width: 100%;

    gap: 30px;
  `,
  tabs: css`
    min-width: 150px;
  `,
  addRequestButton: css`
    margin-bottom: 16px;
  `,
  removeRequestButton: css`
    margin-top: 35px;
  `,
  form: css`
    width: 100%;
  `,
});
