import { useBeforeUnload } from 'react-router-dom-v5-compat';
import { renderHook } from '@testing-library/react';

import { useConfirmBeforeUnload } from './useConfirmBeforeUnload';

jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat');
  return {
    ...originalModule,
    useBeforeUnload: jest.fn(),
  };
});

describe('useConfirmBeforeUnload', () => {
  it('not throw when used without param', () => {
    // @ts-expect-error - Testing without param
    expect(() => renderHook(() => useConfirmBeforeUnload())).not.toThrow();
  });

  it.each([true, false])('should call useBeforeUnload with handler (%s)', () => {
    renderHook(() => useConfirmBeforeUnload(true));
    expect(useBeforeUnload).toHaveBeenCalled();
  });
});
