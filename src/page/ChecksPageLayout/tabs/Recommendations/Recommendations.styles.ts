import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

/**
 * Each finding is a panel whose left edge carries the severity colour, so severity reads once
 * per finding rather than once per row and the rows themselves can stay quiet. Descends from
 * the AI sprint Insights POC (app PR #1674) so the two surfaces still read as the same feature.
 */
export const getStyles = (theme: GrafanaTheme2) => ({
  mutedText: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),

  // Finding panel
  panel: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(2, 2, 2, 2.5),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
    borderLeftWidth: 4,
    backgroundColor: theme.colors.background.primary,
    scrollMarginTop: theme.spacing(3),
  }),
  panelError: css({
    borderLeftColor: theme.colors.error.main,
  }),
  panelWarning: css({
    borderLeftColor: theme.colors.warning.main,
  }),
  panelInfo: css({
    borderLeftColor: theme.colors.info.main,
  }),
  /** Deep-link target: the panel the URL pointed at. */
  panelFocused: css({
    borderColor: theme.colors.primary.border,
  }),

  // Panel header
  collapseToggle: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
    minWidth: 0,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
    textAlign: 'left',
  }),
  caret: css({
    // Optically centre the caret on the first line of the title.
    marginTop: 3,
    flexShrink: 0,
  }),
  sectionTitle: css({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
    margin: 0,
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1.4,
  }),
  tooltipIcon: css({
    color: theme.colors.text.disabled,
    cursor: 'help',
  }),

  // Rows
  rows: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.secondary,
  }),
  groupToggle: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    flex: 1,
    minWidth: 0,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
    textAlign: 'left',
  }),
  rowName: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  // text.secondary rather than text.disabled: the latter fails contrast at this size.
  rowType: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  rowDetail: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.secondary,
    flexShrink: 0,
  }),
  nestedRows: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    marginTop: theme.spacing(0.25),
    paddingLeft: theme.spacing(2.25),
  }),

  checkLink: css({
    color: theme.colors.text.disabled,
    display: 'inline-flex',
    '&:hover': { color: theme.colors.text.primary },
  }),

  // Inline panel that opens under a row to preview an action before it runs. It sits inside a
  // background.primary panel, so it steps darker rather than lighter to stay distinct.
  inlinePanel: css({
    padding: theme.spacing(2, 3),
    margin: theme.spacing(0.5, 0, 1),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.medium}`,
    backgroundColor: theme.colors.background.canvas,
  }),
  inlinePanelTitle: css({
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  previewItem: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.5),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  previewItemLabel: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  doneText: css({
    color: theme.colors.success.text,
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
