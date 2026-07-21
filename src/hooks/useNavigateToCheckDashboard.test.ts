import { renderHook, act } from '@testing-library/react';
import { locationService } from '@grafana/runtime';

import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';

import { DEFAULT_QUERY_FROM_TIME } from 'components/constants';

import { useNavigateToCheckDashboard } from './useNavigateToCheckDashboard';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  locationService: {
    push: jest.fn(),
  },
}));

describe('useNavigateToCheckDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses literal now$2B for existing checks', () => {
    const { result } = renderHook(() => useNavigateToCheckDashboard());

    act(() => {
      result.current(BASIC_HTTP_CHECK, false);
    });

    expect(locationService.push).toHaveBeenCalledWith(
      expect.stringContaining(`from=now$2B${DEFAULT_QUERY_FROM_TIME}`)
    );
    expect(locationService.push).toHaveBeenCalledWith(expect.stringContaining('to=now%2B'));
  });

  it('uses an absolute UTC from value for newly created checks', () => {
    const { result } = renderHook(() => useNavigateToCheckDashboard());
    const createdSeconds = 1_700_000_000;
    const check = {
      ...BASIC_HTTP_CHECK,
      created: createdSeconds,
    };

    act(() => {
      result.current(check, true);
    });

    expect(locationService.push).toHaveBeenCalledWith(expect.stringContaining('from=2023-11-14 22:13:20'));
    expect(locationService.push).toHaveBeenCalledWith(expect.stringContaining('to=now%2B'));
  });
});
