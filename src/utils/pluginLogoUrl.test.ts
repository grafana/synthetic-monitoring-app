import { config } from '@grafana/runtime';

import { getPluginLogoUrl } from './pluginLogoUrl';

it('builds plugin logo URL from appSubUrl and plugin id', () => {
  jest.replaceProperty(config, 'appSubUrl', '/grafana');

  expect(getPluginLogoUrl('k6-app')).toBe('/grafana/public/plugins/k6-app/img/logo.svg');
});

it('supports a custom logo file name', () => {
  jest.replaceProperty(config, 'appSubUrl', '');

  expect(getPluginLogoUrl('grafana-synthetic-monitoring-app', 'icon.svg')).toBe(
    '/public/plugins/grafana-synthetic-monitoring-app/img/icon.svg'
  );
});
