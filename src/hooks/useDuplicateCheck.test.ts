import { renderHook } from '@testing-library/react';
import { BASIC_HTTP_CHECK, BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';

import { CheckTypeGroup } from 'types';

import { useDuplicateCheck } from './useDuplicateCheck';

const mockNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => ({
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: jest.fn(() => mockNavigate),
  }));
  
jest.mock('routing/utils', () => ({
  getRoute: jest.fn((route) => `/mocked/${route}`),
}));

describe('useDuplicateCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate to correct URL for HTTP check duplication', () => {
    const { result } = renderHook(() => useDuplicateCheck());

    result.current.duplicateCheck(BASIC_HTTP_CHECK);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/mocked/checks/new/${CheckTypeGroup.ApiTest}?duplicateId=${BASIC_HTTP_CHECK.id}`
    );
  });

  it('should navigate to correct URL for DNS check duplication', () => {
    const { result } = renderHook(() => useDuplicateCheck());

    result.current.duplicateCheck(BASIC_SCRIPTED_CHECK);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/mocked/checks/new/${CheckTypeGroup.Scripted}?duplicateId=${BASIC_SCRIPTED_CHECK.id}`
    );
  });

  it('should not navigate when check has no ID', () => {
    const checkWithoutId = { ...BASIC_HTTP_CHECK, id: undefined };
    
    const { result } = renderHook(() => useDuplicateCheck());
    
    result.current.duplicateCheck(checkWithoutId);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should not navigate when check type group cannot be found', () => {
    const checkWithUnknownType = {
      ...BASIC_HTTP_CHECK,
      settings: { unknown: {} } as any,
    };
    const { result } = renderHook(() => useDuplicateCheck());

    result.current.duplicateCheck(checkWithUnknownType);

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
