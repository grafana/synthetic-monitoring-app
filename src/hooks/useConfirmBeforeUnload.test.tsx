import { renderHook } from '@testing-library/react';

import { useConfirmBeforeUnload } from './useConfirmBeforeUnload';

describe('useConfirmBeforeUnload', () => {
  it('not throw when used without param', () => {
    // @ts-expect-error - Testing without param
    expect(() => renderHook(() => useConfirmBeforeUnload())).not.toThrow();
  });
});
