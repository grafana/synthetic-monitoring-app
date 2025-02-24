import { useCallback } from 'react';
import { useBeforeUnload } from 'react-router-dom-v5-compat';

/**
 * Hook that blocks the user from leaving/reloading the page when the confirm parameter is `true`.
 *
 * @note This does not hinder location change within app router.
 * @param {boolean} confirm
 * @example
 *  useBeforeUnload(formState.isDirty);
 */
export function useConfirmBeforeUnload(confirm: boolean) {
  const handler = useCallback(
    (event: BeforeUnloadEvent) => {
      if (confirm) {
        event.preventDefault();
        // eslint-disable-next-line deprecation/deprecation
        event.returnValue = ''; // legacy support
      }
    },
    [confirm]
  );

  useBeforeUnload(handler);
}
