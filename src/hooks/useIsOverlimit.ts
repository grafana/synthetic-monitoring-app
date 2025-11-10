import { CheckType } from 'types';

import { useLimits } from './useLimits';

export function useIsOverlimit(isExistingCheck: boolean, checkType: CheckType) {
  const { isOverBrowserLimit, isOverHgExecutionLimit, isOverCheckLimit, isOverScriptedLimit, isReady } = useLimits();
  // It should always be possible to edit existing checks
  if (isExistingCheck) {
    return false;
  }

  if (!isReady) {
    // null indicates loading/pending state
    return null;
  }

  return (
    isOverHgExecutionLimit ||
    isOverCheckLimit ||
    (checkType === CheckType.Browser && isOverBrowserLimit) ||
    ([CheckType.MULTI_HTTP, CheckType.Scripted].includes(checkType) && isOverScriptedLimit)
  );
}
