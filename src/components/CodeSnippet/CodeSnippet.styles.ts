import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function getStyles(theme: GrafanaTheme2) {
  const codeStyleBase = css({
    overflow: 'auto',
    flexGrow: 1,
    display: 'block',
    fontFamily: "Menlo, Monaco, 'Courier New', monospace",
    fontSize: '14px',
    lineHeight: '24px',
    color: `${theme.colors.text.primary} !important`,
    textShadow: 'none',
    whiteSpace: 'pre-wrap',
    margin: '0',
    padding: `${theme.spacing(2)}`,
    border: 'none',
    backgroundColor: 'transparent',
  });

  return {
    header: css({
      backgroundColor: `${theme.colors.border.medium}`,
      minHeight: '42px', // Height of TabBar
      display: 'flex',
      alignItems: 'center',
      padding: `${theme.spacing(0, 2)}`,
    }),
    section: css({
      display: 'flex',
      position: 'relative',
    }),
    codeWrapper: css({
      display: 'flex',
      flexGrow: 1,
      borderRadius: `${theme.shape.radius.default}`,
      overflow: 'hidden',
      backgroundColor: `${theme.colors.background.canvas}`, // same as MonacoEditor
    }),
    code: css`
      ${codeStyleBase}

      .token.boolean,
      .token.string {
        color: ${theme.visualization.getColorByName('green')};
      }

      .token.constant {
        color: ${theme.visualization.getColorByName('light-blue')};
      }

      .token.function {
        color: ${theme.colors.text.primary};
      }

      .token.punctuation {
        color: ${theme.colors.text.primary};
      }

      .token.keyword {
        color: ${theme.visualization.getColorByName('light-blue')};
      }

      .token.number {
        color: ${theme.visualization.getColorByName('green')};
      }

      .token.operator {
        color: ${theme.visualization.getColorByName('gray')};
        background-color: transparent;
      }

      .token.comment {
        opacity: 0.4;
      }
    `,
    buttonWrapper: css({
      position: 'absolute',
      top: `${theme.spacing(1)}`,
      right: `${theme.spacing(1)}`,
    }),
    tabsBar: css(`
      border-bottom: 'none',

      > [role='tablist'] {
        height: auto;
      }
    `),
    tabGroup: css`
      display: flex;
      flex-direction: column;
      padding: ${theme.spacing(2, 2, 2, 1.5)};
      border-right: 1px ${theme.colors['border']['medium']} solid;
      flex: 0 0 200px;
    `,
    activeTabGroup: css`
      position: relative;
      padding-left: ${theme.spacing(1.5)};
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: ${theme.spacing(1)};
      cursor: pointer;
      opacity: 1;
      font-weight: 500;
      min-height: ${theme.spacing(3)};
      line-height: 1.21em; // To make wrapped text look nice

      &::after {
        display: block;
        font-weight: 500;
        content: ' ';
        height: ${theme.spacing(3)};
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: ${theme.spacing(0.5)};
        border-radius: ${theme.shape.radius.default};
        background-image: ${theme.colors.gradients.brandVertical};
      }

      &:hover {
        text-decoration: underline;
        opacity: 1;
      }
    `,
    inactiveTabGroup: css`
      position: relative;
      padding-left: ${theme.spacing(1.5)};
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: ${theme.spacing(1)};
      cursor: pointer;
      opacity: 0.65;
      font-weight: 500;
      min-height: ${theme.spacing(3)};
      line-height: 1.21em; // To make wrapped text look nice

      &::after {
        display: none;
        font-weight: 500;
        content: ' ';
        height: ${theme.spacing(3)};
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: ${theme.spacing(0.5)};
        border-radius: ${theme.shape.radius.default};
        background-color: gray;
      }

      &:hover {
        text-decoration: underline;
        opacity: 1;
      }
    `,
  };
}
