import { createTheme } from 'react-data-table-component';

export const createTableTheme = (isDark: boolean) => {
  if (isDark) {
    createTheme('grafana-dark', {
      text: {
        primary: 'rgb(204, 204, 220)',
        secondary: '#2aa198',
      },
      background: {
        default: '#181b1f;',
      },
      context: {
        background: '#cb4b16',
        text: '#FFFFFF',
      },
      divider: {
        default: 'rgba(204, 204, 220, 0.07)',
      },
      highlightOnHover: {
        default: '#111217',
        text: '#FFFFFF',
      },
      sortFocus: {
        default: '#2aa198',
      },
    });
  } else {
    createTheme('grafana-light', {
      text: {
        primary: 'rgb(36, 41, 46);',
        secondary: '#2aa198',
      },
      background: {
        default: 'rgb(255, 255, 255);',
      },
      context: {
        background: '#cb4b16',
        text: '#FFFFFF',
      },
      divider: {
        default: 'rgba(36, 41, 46, 0.12)',
      },
      highlightOnHover: {
        default: 'rgb(247, 247, 247)',
      },
      sortFocus: {
        default: '#2aa198',
      },
    });
  }
};
