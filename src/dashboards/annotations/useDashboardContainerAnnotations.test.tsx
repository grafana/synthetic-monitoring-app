import { DataSourceInstanceSettings } from '@grafana/data';
import { renderHook } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { useDashboardContainerAnnotations } from './useDashboardContainerAnnotations';

let metricsDS = {} as DataSourceInstanceSettings;

jest.mock('hooks/useMetricsDS', () => ({
  useMetricsDS: () => metricsDS,
}));

jest.mock('hooks/useSMDS', () => ({
  useSMDS: () => ({
    instanceSettings: { jsonData: { metrics: { grafanaName: 'prometheus' } } },
  }),
}));

describe('useDashboardContainerAnnotations', () => {
  beforeEach(() => {
    metricsDS = {} as DataSourceInstanceSettings;
  });

  it('keeps definitions stable while their datasource identity is unchanged', () => {
    const { result, rerender } = renderHook(() => useDashboardContainerAnnotations(BASIC_HTTP_CHECK));
    const initialDefinitions = result.current;

    rerender();

    expect(result.current).toBe(initialDefinitions);
  });

  it('uses the provisioned datasource identity before instance settings are resolved', () => {
    const { result } = renderHook(() => useDashboardContainerAnnotations(BASIC_HTTP_CHECK));

    expect(result.current[0].datasource).toEqual({ uid: 'prometheus', type: 'prometheus' });
  });

  it('refreshes definitions when a datasource receives its uid in place', () => {
    const { result, rerender } = renderHook(() => useDashboardContainerAnnotations(BASIC_HTTP_CHECK));
    const initialDefinitions = result.current;

    metricsDS.uid = 'resolved-prometheus';
    rerender();

    expect(result.current).not.toBe(initialDefinitions);
    expect(result.current[0].datasource?.uid).toBe('resolved-prometheus');
  });

  it('retains the alert name and state labels for annotation text', () => {
    const { result } = renderHook(() => useDashboardContainerAnnotations(BASIC_HTTP_CHECK));

    expect(result.current[0]?.expr).toContain('max by (alertname, alertstate)');
  });
});
