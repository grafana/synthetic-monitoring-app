import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

import { RecommendationSeverity } from './Recommendations.types';

export const getSeverityColor = (theme: GrafanaTheme2, severity: RecommendationSeverity) => theme.colors[severity].main;

// Descends from the AI sprint Insights POC (app PR #1674) so the two surfaces read as one feature.
export const getStyles = (theme: GrafanaTheme2) => ({
  mutedText: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),

  layout: css({
    display: 'flex',
    alignItems: 'stretch',
    gap: theme.spacing(3),
    // So the rail still reads as a rail on the short landing view.
    minHeight: '60vh',
  }),
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    flex: 1,
    minWidth: 0,
  }),
  feedback: css({
    flexShrink: 0,
  }),
  footer: css({
    marginTop: 'auto',
  }),

  rail: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    width: 220,
    flexShrink: 0,
    padding: theme.spacing(0, 2, 2, 0),
    borderRight: `1px solid ${theme.colors.border.weak}`,
    overflowY: 'auto',
  }),
  railDivider: css({
    height: 1,
    margin: theme.spacing(1, 0),
    backgroundColor: theme.colors.border.weak,
  }),
  railItem: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    width: '100%',
    padding: theme.spacing(0.75, 1.5),
    border: 'none',
    borderRadius: theme.shape.radius.default,
    background: 'none',
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body.fontSize,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.action.hover,
    },
  }),
  railItemActive: css({
    backgroundColor: theme.colors.action.selected,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightMedium,
    '&:hover': {
      backgroundColor: theme.colors.action.selected,
    },
  }),
  railDot: css({
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  }),
  railCount: css({
    marginLeft: 'auto',
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),

  attentionRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    width: '100%',
    padding: theme.spacing(1.75, 2),
    border: `1px solid ${theme.colors.border.weak}`,
    borderLeftWidth: 4,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.primary,
    color: theme.colors.text.primary,
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.colors.action.hover,
    },
  }),
  attentionLabel: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  attentionAction: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
    flexShrink: 0,
    color: theme.colors.primary.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),

  legend: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  legendEntry: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  }),
  // Same shape as a panel's left border.
  legendBar: css({
    width: 14,
    height: 4,
    borderRadius: 2,
  }),

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
  panelFocused: css({
    borderColor: theme.colors.primary.border,
  }),

  // One line; the title is the only thing that gives way.
  panelHeader: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.5),
  }),
  collapseToggle: css({
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
    flex: 1,
    minWidth: 0,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
    textAlign: 'left',
  }),
  caret: css({
    // Optically centred on the title's first line.
    marginTop: 3,
    flexShrink: 0,
  }),
  sectionTitle: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    minWidth: 0,
    margin: 0,
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    lineHeight: 1.4,
  }),
  sectionTitleText: css({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  tooltipIcon: css({
    color: theme.colors.text.disabled,
    cursor: 'help',
  }),
  panelActions: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginLeft: 'auto',
    flexShrink: 0,
  }),

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
  rowSelected: css({
    backgroundColor: theme.colors.emphasize(theme.colors.background.secondary, 0.06),
  }),
  rowMain: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flex: 1,
    minWidth: 0,
  }),
  rowControls: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexShrink: 0,
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  // text.disabled fails contrast at this size.
  rowType: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  rowDetail: css({
    fontSize: theme.typography.bodySmall.fontSize,
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

  // Inside a background.primary panel, so it steps darker rather than lighter.
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
