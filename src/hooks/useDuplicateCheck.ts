import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { CHECK_TYPE_OPTIONS } from 'hooks/useCheckTypeOptions';

export function useDuplicateCheck() {
  const navigate = useNavigate();

  const duplicateCheck = useCallback(
    (check: Check) => {
      const checkType = getCheckType(check.settings);

      const checkTypeOption = CHECK_TYPE_OPTIONS.find((option) => option.value === checkType);
      const checkTypeGroup = checkTypeOption?.group;

      if (!checkTypeGroup) {
        return;
      }

      if (!check.id) {
        return;
      }

      const searchParams = new URLSearchParams();
      searchParams.set('duplicateId', check.id.toString());

      navigate(`${getRoute(AppRoutes.NewCheck)}/${checkTypeGroup}?${searchParams.toString()}`);
    },
    [navigate]
  );

  return {
    duplicateCheck,
  };
}
