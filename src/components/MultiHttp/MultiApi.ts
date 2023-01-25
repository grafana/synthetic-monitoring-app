import { useCallback, useContext } from 'react';

import { getUpdatedCheck } from './consts';
import { trackEvent } from 'analytics';
import { InstanceContext } from 'contexts/InstanceContext';

export const useOnSubmit = ({ check, getValues, onReturn, setErrorMessages }) => {
  const {
    instance: { api },
  } = useContext(InstanceContext);

  useCallback(async () => {
    try {
      if (check?.id) {
        trackEvent('editCheckSubmit');
        await api?.updateCheck({
          id: check.id,
          tenantId: check.tenantId,
          ...getUpdatedCheck(getValues),
        });
      } else {
        trackEvent('addNewCheckSubmit');
        await api?.addCheck(getUpdatedCheck(getValues));
      }
      onReturn && onReturn(true);
    } catch (err) {
      setErrorMessages([err?.data?.err || err?.data?.msg]);
    }
  }, [api, getValues, onReturn, check.tenantId, check.id, setErrorMessages]);
};
