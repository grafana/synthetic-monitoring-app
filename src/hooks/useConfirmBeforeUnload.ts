import { useCallback } from 'react';
import { useBeforeUnload } from 'react-router-dom-v5-compat';
import { useSessionStorage } from 'usehooks-ts';

import { DEV_STORAGE_KEYS } from 'components/DevTools/DevTools.constants';

/**
 * Hook that blocks the user from leaving/reloading the page when the confirm parameter is `true`.
 *
 * @note This does not hinder location change within app router.
 * @param {boolean} confirm
 * @example
 *  useBeforeUnload(formState.isDirty);
 */
export function useConfirmBeforeUnload(confirm: boolean) {
  let _confirm = confirm;
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- This code is completely stripped out in production
    const [override] = useSessionStorage(DEV_STORAGE_KEYS.confirmLeavingPageOverride, false, {
      initializeWithValue: false,
    });

    _confirm = !override && confirm;
  }

  const handler = useCallback(
    (event: BeforeUnloadEvent) => {
      if (_confirm) {
        event.preventDefault();
        // eslint-disable-next-line deprecation/deprecation
        event.returnValue = ''; // legacy support
      }
    },
    [_confirm]
  );

  useBeforeUnload(handler);
}
