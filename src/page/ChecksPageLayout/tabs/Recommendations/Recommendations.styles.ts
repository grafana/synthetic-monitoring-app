import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

/**
 * Adapted from the AI sprint Insights POC (app PR #1674) so the two surfaces read as the
 * same feature: collapsible sections, flat full-width rows and a coloured severity bar.
 */
export const getStyles = (theme: GrafanaTheme2) => ({
  mutedText: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
  }),

  // Section chrome
  sectionHeading: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    margin: 0,
    fontSize: theme.typography.h4.fontSize,
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

  // Rows
  row: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    borderRadius: theme.shape.radius.default,
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  rowClickable: css({
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
    '&:hover': { borderColor: theme.colors.border.medium },
  }),
  rowInfo: css({
    flex: 1,
    minWidth: 0,
  }),
  rowName: css({
    fontWeight: theme.typography.fontWeightMedium,
    fontSize: theme.typography.body.fontSize,
  }),
  rowDetail: css({
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text.secondary,
    flexShrink: 0,
  }),
  nestedRows: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.5),
    paddingLeft: theme.spacing(2),
  }),

  // Severity indicator
  indicator: css({
    width: 4,
    height: 32,
    borderRadius: 2,
    flexShrink: 0,
  }),
  indicatorError: css({
    backgroundColor: theme.colors.error.main,
  }),
  indicatorWarning: css({
    backgroundColor: theme.colors.warning.main,
  }),
  indicatorInfo: css({
    backgroundColor: theme.colors.info.main,
  }),

  checkLink: css({
    color: theme.colors.text.disabled,
    display: 'inline-flex',
    '&:hover': { color: theme.colors.text.primary },
  }),
});
