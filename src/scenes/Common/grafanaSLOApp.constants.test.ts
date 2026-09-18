import { config } from '@grafana/runtime';

import { buildSLOEditHref } from './grafanaSLOApp.constants';

describe('buildSLOEditHref', () => {
  it('builds the native SLO wizard review URL', () => {
    jest.replaceProperty(config, 'appSubUrl', '');

    expect(buildSLOEditHref('abc-123')).toBe('/a/grafana-slo-app/wizard/review/abc-123');
  });

  it('prefixes appSubUrl when Grafana is served from a subpath', () => {
    jest.replaceProperty(config, 'appSubUrl', '/grafana');

    expect(buildSLOEditHref('abc-123')).toBe('/grafana/a/grafana-slo-app/wizard/review/abc-123');
  });

  it('encodes the uuid as a single path segment', () => {
    jest.replaceProperty(config, 'appSubUrl', '');

    expect(buildSLOEditHref('../evil')).toBe('/a/grafana-slo-app/wizard/review/..%2Fevil');
  });
});
