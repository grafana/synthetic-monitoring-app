import { locationService } from '@grafana/runtime';
import { getGlobalTrackingProps } from 'features/tracking/globalTrackingProps';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { queryClient } from 'data/queryClient';

describe('getGlobalTrackingProps', () => {
  afterEach(() => {
    queryClient.clear();
  });

  describe('page', () => {
    it.each([
      ['/a/grafana-synthetic-monitoring-app/home', 'home'],
      ['/a/grafana-synthetic-monitoring-app/checks', 'checks'],
      ['/a/grafana-synthetic-monitoring-app/checks/42', 'checks/:id'],
      ['/a/grafana-synthetic-monitoring-app/checks/42/edit', 'checks/:id/edit'],
      ['/a/grafana-synthetic-monitoring-app/checks/choose-type', 'checks/choose-type'],
      ['/a/grafana-synthetic-monitoring-app/checks/new', 'checks/new'],
      ['/a/grafana-synthetic-monitoring-app/checks/new/api-endpoint', 'checks/new/:checkTypeGroup'],
      ['/a/grafana-synthetic-monitoring-app/config', 'config'],
      ['/a/grafana-synthetic-monitoring-app/config/access-tokens', 'config/access-tokens'],
      ['/a/grafana-synthetic-monitoring-app/probes', 'probes'],
      ['/a/grafana-synthetic-monitoring-app/probes/7/edit', 'probes/:id/edit'],
    ])('resolves %s to the route pattern "%s"', (pathname, expectedPattern) => {
      locationService.push(pathname);

      expect(getGlobalTrackingProps().page).toBe(expectedPattern);
    });

    it('reports the raw pathname for pages outside the plugin', () => {
      locationService.push('/connections/datasources');

      expect(getGlobalTrackingProps().page).toBe('/connections/datasources');
    });

    it('reports unknown plugin sub-pages as their app-relative pathname', () => {
      locationService.push('/a/grafana-synthetic-monitoring-app/does-not-exist');

      expect(getGlobalTrackingProps().page).toBe('/does-not-exist');
    });
  });

  describe('check_count', () => {
    it('is undefined when the check list has not been fetched', () => {
      expect(getGlobalTrackingProps().check_count).toBeUndefined();
    });

    it('reports the number of checks in the query cache', () => {
      queryClient.setQueryData(['checks', { includeAlerts: true }], [BASIC_HTTP_CHECK, BASIC_DNS_CHECK]);

      expect(getGlobalTrackingProps().check_count).toBe(2);
    });
  });

  it('still reports the other props when one resolver throws', () => {
    queryClient.setQueryData(['checks', { includeAlerts: true }], [BASIC_HTTP_CHECK]);
    jest.mocked(locationService.getLocation).mockImplementationOnce(() => {
      throw new Error('location unavailable');
    });

    const props = getGlobalTrackingProps();

    expect(props.page).toBeUndefined();
    expect(props.check_count).toBe(1);
  });
});
