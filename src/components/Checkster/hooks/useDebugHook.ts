import { useEffect } from 'react';

export function useDebugHook(hookName: string, ...dependencies: any[]) {
  useEffect(() => {
    console.log(`[Hook] ${hookName} dependencies changed:`, dependencies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
