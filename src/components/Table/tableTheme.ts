import { createTheme } from 'react-data-table-component';
import { GrafanaTheme2 } from '@grafana/data';

export const createTableTheme = (theme: GrafanaTheme2) => {
  createTheme('grafana', {
    text: {
      primary: theme.colors.text.primary,
      secondary: theme.colors.text.secondary,
    },
    background: {
      default: theme.colors.background.primary,
    },
    context: {
      background: theme.colors.background.secondary,
      text: theme.colors.text.primary,
    },
    divider: {
      default: theme.colors.border.weak,
    },
    highlightOnHover: {
      default: theme.colors.background.secondary,
      text: theme.colors.text.primary,
    },
    sortFocus: {
      default: theme.colors.primary.main,
    },
  });
};
