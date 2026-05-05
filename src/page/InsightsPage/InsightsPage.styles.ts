import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export const getStyles = (theme: GrafanaTheme2) => ({
  cardGrid: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: theme.spacing(1),
    alignItems: 'stretch',
    '& > div': { height: '100%' },
  }),
  mutedText: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),

  // Limit bars
  limitLabel: css({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: theme.typography.bodySmall.fontSize,
    marginBottom: theme.spacing(0.25),
  }),
  limitBarTrack: css({
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background.secondary,
  }),
  limitBarFill: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.primary.main,
    transition: 'width 0.3s ease',
  }),
  limitBarFillWarning: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.warning.main,
    transition: 'width 0.3s ease',
  }),

  // Probe histogram
  histogramRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  histogramRowLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    minWidth: 60,
    textAlign: 'right' as const,
  }),
  histogramRowTrack: css({
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.background.canvas,
  }),
  histogramRowFill: css({
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primary.main,
    minWidth: 4,
  }),
  histogramRowCount: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    minWidth: 20,
  }),

  // Links
  redLink: css({
    color: theme.colors.error.text,
    fontSize: theme.typography.bodySmall.fontSize,
    '&:hover': { textDecoration: 'underline' },
  }),
  tooltipLink: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    textDecoration: `underline dotted ${theme.colors.text.disabled}`,
    textUnderlineOffset: 3,
    cursor: 'help',
  }),
  viewLink: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.primary.text,
    '&:hover': { textDecoration: 'underline' },
  }),
  subtleLink: css({
    color: 'inherit',
    '&:hover': { textDecoration: 'underline' },
  }),

  // Performance colors
  colorError: theme.colors.error.main,
  colorWarning: theme.colors.warning.main,
  colorInfo: theme.colors.info.main,

  // Performance rows
  perfIndicator: css({
    width: 4,
    height: 32,
    borderRadius: 2,
    flexShrink: 0,
  }),
  perfInfo: css({
    flex: 1,
    minWidth: 0,
  }),
  perfCheckName: css({
    display: 'block',
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  perfDetail: css({
    display: 'block',
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  perfGroupLabel: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.primary,
    marginTop: theme.spacing(1),
  }),
  perfValue: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    flexShrink: 0,
    textAlign: 'right' as const,
    minWidth: 80,
  }),
  perfValueCritical: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.error.text,
    fontWeight: theme.typography.fontWeightMedium,
    flexShrink: 0,
    textAlign: 'right' as const,
    minWidth: 80,
  }),
  perfBar: css({
    width: 120,
    flexShrink: 0,
  }),
  perfBarTrack: css({
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.background.canvas,
  }),
  perfBarFillWarning: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.warning.main,
  }),
  perfBarFillError: css({
    height: '100%',
    borderRadius: 3,
    backgroundColor: theme.colors.error.main,
  }),
  perfLatencyChange: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.bodySmall.fontSize,
    flexShrink: 0,
  }),
  perfLatencyBad: css({
    color: theme.colors.warning.text,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  perfLatencyCritical: css({
    color: theme.colors.error.text,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  perfRowClickable: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
    '&:hover': { borderColor: theme.colors.border.medium },
  }),
  investigateIcon: css({
    color: theme.colors.text.disabled,
  }),
  dashboardLink: css({
    color: theme.colors.text.disabled,
    '&:hover': { color: theme.colors.text.primary },
  }),

  // Investigation panel
  inlineInvestigation: css({
    padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
    margin: `${theme.spacing(0.5)} 0 ${theme.spacing(1)} 0`,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.medium}`,
    backgroundColor: theme.colors.background.primary,
  }),
  actionBar: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    borderTop: `1px solid ${theme.colors.border.weak}`,
    flexWrap: 'wrap' as const,
  }),
  actionBarLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  investigateHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  }),
  investigateTitle: css({
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  investigateContent: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: 1.8,
    color: theme.colors.text.secondary,
    maxWidth: 720,
    '& h1, & h2, & h3': {
      fontSize: theme.typography.body.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.primary,
      margin: `${theme.spacing(2)} 0 ${theme.spacing(1)} 0`,
    },
    '& h1:first-child, & h2:first-child, & h3:first-child': { marginTop: 0 },
    '& p': { margin: `0 0 ${theme.spacing(1)} 0` },
    '& ul, & ol': { margin: `0 0 ${theme.spacing(1)} 0`, paddingLeft: theme.spacing(2.5) },
    '& li': { marginBottom: theme.spacing(0.5) },
    '& strong': { fontWeight: theme.typography.fontWeightMedium, color: theme.colors.text.primary },
    '& code': {
      fontSize: '0.85em',
      padding: `2px ${theme.spacing(0.75)}`,
      borderRadius: 4,
      backgroundColor: theme.colors.background.secondary,
      fontFamily: theme.typography.fontFamilyMonospace,
    },
    '& blockquote': {
      margin: `${theme.spacing(1)} 0`,
      padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
      borderLeft: `3px solid ${theme.colors.primary.main}`,
      backgroundColor: theme.colors.background.secondary,
      borderRadius: `0 ${theme.shape.radius.default} ${theme.shape.radius.default} 0`,
      fontSize: 12,
      lineHeight: 1.5,
    },
    '& blockquote *': {
      fontSize: 12,
      lineHeight: 1.5,
    },
    '& blockquote p': { margin: `0 0 ${theme.spacing(0.25)} 0` },
    '& blockquote p:last-child': { margin: 0 },
    '& blockquote ol, & blockquote ul': {
      margin: 0,
      paddingLeft: theme.spacing(1.5),
    },
    '& blockquote li': {
      marginBottom: theme.spacing(0.5),
    },
  }),

  // Section chrome
  sectionHeading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  }),
  tooltipIcon: css({
    color: theme.colors.text.disabled,
    cursor: 'help',
  }),
  collapseToggle: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'inherit',
    marginBottom: theme.spacing(1),
  }),
  collapseHeading: css({
    margin: 0,
  }),

  // Recommendations
  recommendationCard: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.medium}`,
    backgroundColor: theme.colors.background.secondary,
  }),
  recommendationHeader: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
  recommendationTitle: css({
    margin: 0,
    marginBottom: theme.spacing(0.5),
    fontSize: theme.typography.h5.fontSize,
  }),
  recommendationDescription: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body.fontSize,
  }),
  recoItem: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing(0.75)} ${theme.spacing(1.5)}`,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  recoItemLabel: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
  recoItemDetail: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  recoNewValue: css({
    color: theme.colors.success.text,
    fontWeight: theme.typography.fontWeightMedium,
  }),
});
