import { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

export function getTablePanelStyles(theme: GrafanaTheme2) {
  return {
    container: css({
      border: `1px solid ${theme.components.panel.borderColor}`,
      width: '100%',
      borderRadius: theme.shape.radius.default,
    }),
    title: css({
      label: 'panel-title',
      display: 'flex',
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
  };
}
