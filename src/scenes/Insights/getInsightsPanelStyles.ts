import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function getInsightsPanelStyles(theme: GrafanaTheme2) {
  return {
    rowContainer: css({
      borderRadius: theme.shape.radius.default,
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap', // Allows the container to wrap items to the next line if needed
      gap: theme.spacing(2), // Adds space between the insights
    }),
    container: css({
      border: `1px solid ${theme.components.panel.borderColor}`,
      width: '100%',
      borderRadius: theme.shape.radius.default,
      gap: theme.spacing(2), // Adds space between the insights
    }),
    title: css({
      label: 'panel-title',
      display: 'block',
      marginBottom: 0, // override default h6 margin-bottom
      padding: theme.spacing(theme.components.panel.padding),
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      fontSize: theme.typography.h6.fontSize,
      fontWeight: theme.typography.h6.fontWeight,
    }),
    headerContainer: css({
      label: 'panel-header',
      display: 'flex',
      alignItems: 'center',
    }),
    noDataContainer: css({
      padding: theme.spacing(4),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }),
    table: css({
      '& > div': {
        display: 'flex',
      },
    }),
    insight: css({
      border: `1px solid ${theme.components.panel.borderColor}`,
      borderRadius: theme.shape.radius.default,
      display: 'flex',
      flex: '1 1 calc(33% - 16px)', // Flex properties to ensure insights adjust size and have spacing
      flexDirection: 'column',
      padding: theme.spacing(theme.components.panel.padding),
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'normal', // Allow content to wrap within the insight container
    }),
  };
}
