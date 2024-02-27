import { useCallback, useState } from 'react';

import { Check, CheckType } from 'types';
import { AdHocCheckResponse } from 'datasource/responses.types';
import { useTestCheck } from 'data/useChecks';

export function useAdhocTest(checkType: CheckType) {
  const [openTestCheckModal, setOpenTestCheckModal] = useState(false);
  const [adhocTestData, setAdhocTestData] = useState<AdHocCheckResponse>();
  const { mutate, isPending, error } = useTestCheck({ eventInfo: { type: checkType } });

  const testCheck = useCallback(
    (check: Check) => {
      mutate(check, {
        onSuccess: (data) => {
          setAdhocTestData(data);
          setOpenTestCheckModal(true);
        },
      });
    },
    [mutate]
  );

  const closeModal = useCallback(() => {
    setOpenTestCheckModal(false);
  }, []);

  return {
    adhocTestData,
    closeModal,
    testCheck,
    isPending,
    openTestCheckModal,
    testCheckError: error,
  };
}
