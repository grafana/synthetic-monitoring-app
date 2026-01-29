import { useBeforeUnload } from 'react-router-dom';
import { renderHook } from '@testing-library/react';

import { useConfirmBeforeUnload } from './useConfirmBeforeUnload';

jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
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
