import { renderHook } from '@testing-library/react';
import { BASIC_HTTP_CHECK, BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';

import { CheckType, CheckTypeGroup } from 'types';

import { useDuplicateCheckUrl } from './useDuplicateCheck';

jest.mock('routing/utils', () => ({
  getRoute: jest.fn((route) => `/mocked/${route}`),
}));

describe('useDuplicateCheckUrl', () => {
  it('should return correct URL for HTTP check duplication', () => {
    const { result } = renderHook(() => useDuplicateCheckUrl());

    const url = result.current.duplicateCheckUrl(BASIC_HTTP_CHECK);

    expect(url).toBe(
      `/mocked/checks/new/${CheckTypeGroup.ApiTest}?duplicateId=${BASIC_HTTP_CHECK.id}&checkType=${CheckType.HTTP}`
    );
  });

  it('should return correct URL for Scripted check duplication', () => {
    const { result } = renderHook(() => useDuplicateCheckUrl());

    const url = result.current.duplicateCheckUrl(BASIC_SCRIPTED_CHECK);

    expect(url).toBe(
      `/mocked/checks/new/${CheckTypeGroup.Scripted}?duplicateId=${BASIC_SCRIPTED_CHECK.id}&checkType=${CheckType.Scripted}`
    );
  });

  it('should return undefined when check has no ID', () => {
    const checkWithoutId = { ...BASIC_HTTP_CHECK, id: undefined };

    const { result } = renderHook(() => useDuplicateCheckUrl());

    const url = result.current.duplicateCheckUrl(checkWithoutId);

    expect(url).toBeUndefined();
  });

  it('should return undefined when check type group cannot be found', () => {
    const checkWithUnknownType = {
      ...BASIC_HTTP_CHECK,
      settings: { unknown: {} } as any,
    };
    const { result } = renderHook(() => useDuplicateCheckUrl());

    const url = result.current.duplicateCheckUrl(checkWithUnknownType);

    expect(url).toBeUndefined();
  });
});
