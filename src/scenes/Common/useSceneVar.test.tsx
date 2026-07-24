import { useVariables } from '@grafana/scenes-react';
import { renderHook } from '@testing-library/react';

import { useCheckDashboardOptional } from 'contexts/CheckDashboardProvider';
import { useDashboardPanelScopeOptional } from 'contexts/DashboardPanelScopeProvider';

import { useSceneVar } from './useSceneVar';

jest.mock('@grafana/scenes-react', () => ({ useVariables: jest.fn() }));
jest.mock('contexts/CheckDashboardProvider', () => ({ useCheckDashboardOptional: jest.fn() }));
jest.mock('contexts/DashboardPanelScopeProvider', () => ({ useDashboardPanelScopeOptional: jest.fn() }));

describe('useSceneVar', () => {
  beforeEach(() => {
    jest.mocked(useVariables).mockReturnValue([]);
    jest.mocked(useCheckDashboardOptional).mockReturnValue({
      check: { job: 'health-check', target: 'https://example.test' },
      urlFormat: 'canonical',
    } as ReturnType<typeof useCheckDashboardOptional>);
    jest.mocked(useDashboardPanelScopeOptional).mockReturnValue(null);
  });

  it('uses all probes without panel scope', () => {
    const { result } = renderHook(() => useSceneVar('probe'));

    expect(result.current).toEqual(['.*']);
  });

  it('uses selected probes inside panel scope', () => {
    jest.mocked(useDashboardPanelScopeOptional).mockReturnValue({
      probes: ['london'],
    } as ReturnType<typeof useDashboardPanelScopeOptional>);

    const { result } = renderHook(() => useSceneVar('probe'));

    expect(result.current).toEqual(['london']);
  });
});
