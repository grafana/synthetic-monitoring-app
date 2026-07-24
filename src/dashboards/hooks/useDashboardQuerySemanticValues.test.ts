import { renderHook } from '@testing-library/react';

import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';
import {
  DashboardPanelScopeContextValue,
  useDashboardPanelScopeOptional,
} from 'contexts/DashboardPanelScopeProvider';

import { useDashboardQuerySemanticValues, useDashboardTimeRange } from './useDashboardQuerySemanticValues';

jest.mock('contexts/AppTimeProvider', () => ({
  useAppTime: jest.fn(),
}));

jest.mock('contexts/CheckDashboardProvider', () => ({
  useCheckDashboard: jest.fn(),
}));
jest.mock('contexts/DashboardPanelScopeProvider', () => ({
  useDashboardPanelScopeOptional: jest.fn(),
}));

const useAppTimeMock = jest.mocked(useAppTime);
const useCheckDashboardMock = jest.mocked(useCheckDashboard);
const useDashboardPanelScopeOptionalMock = jest.mocked(useDashboardPanelScopeOptional);

describe('dashboard query semantic hooks', () => {
  beforeEach(() => {
    useAppTimeMock.mockReturnValue({
      absolute: { from: 10, to: 20 },
      raw: { from: 'now-3h', to: 'now' },
    } as ReturnType<typeof useAppTime>);
    useCheckDashboardMock.mockReturnValue({
      check: { job: 'health-check', target: 'https://example.test' },
    } as ReturnType<typeof useCheckDashboard>);
    useDashboardPanelScopeOptionalMock.mockReturnValue(null);
  });

  it('uses an explicit range for TimeRange values', () => {
    const { result } = renderHook(() => useDashboardTimeRange({ from: 100, to: 200 }));

    expect(result.current.from.valueOf()).toBe(100);
    expect(result.current.to.valueOf()).toBe(200);
  });

  it('uses all probes outside panel scope', () => {
    const { result } = renderHook(() => useDashboardQuerySemanticValues());

    expect(result.current.probes).toEqual([]);
  });

  it('uses panel-scoped probes with an explicit range for semantic values', () => {
    useDashboardPanelScopeOptionalMock.mockReturnValue({
      probes: ['london'],
    } as DashboardPanelScopeContextValue);

    const { result } = renderHook(() =>
      useDashboardQuerySemanticValues(60, { from: 1_000, to: 3_601_000 })
    );

    expect(result.current).toMatchObject({
      job: 'health-check',
      instance: 'https://example.test',
      probes: ['london'],
      rangeSeconds: 3_600,
    });
  });
});
