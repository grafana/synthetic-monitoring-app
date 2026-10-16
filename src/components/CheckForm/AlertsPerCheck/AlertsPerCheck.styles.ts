import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export const getAlertItemStyles = (theme: GrafanaTheme2) => ({
  alert: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    background: theme.colors.background.primary,
    overflow: 'hidden',
  }),
  header: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1.5, 2, 0),
  }),
  checkbox: css({
    '& > span': {
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
      fontWeight: theme.typography.fontWeightMedium,
    },
  }),
  runbookToggle: css({
    marginLeft: 'auto',
    color: theme.colors.text.secondary,
    borderColor: theme.colors.border.medium,
    fontWeight: theme.typography.fontWeightRegular,
  }),
  body: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2, 2, 5),
  }),
  alertStatus: css({
    display: 'flex',
    alignItems: 'center',
  }),
  alertRow: css({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5, 1),
    // Align sentence fragments with controls. Validation messages stay below them.
    '& > *': {
      margin: 0,
      minHeight: theme.spacing(theme.components.height.md),
      display: 'flex',
      alignItems: 'center',
    },
  }),
  alertTooltip: css({
    display: 'flex',
    alignItems: 'center',
    color: theme.colors.text.secondary,
  }),
  executionCount: css({
    textDecoration: 'underline dotted',
    textUnderlineOffset: '3px',
  }),
  footer: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    background: theme.colors.background.secondary,
    padding: theme.spacing(1, 2, 1, 5),
  }),
  runbook: css({
    maxWidth: '480px',
    '& > div:last-child': { marginBottom: 0 },
  }),
});
