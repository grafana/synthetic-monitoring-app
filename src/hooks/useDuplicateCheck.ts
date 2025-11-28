import { Check } from 'types';
import { getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { CHECK_TYPE_OPTIONS } from 'hooks/useCheckTypeOptions';

export function useDuplicateCheckUrl() {
  const duplicateCheckUrl = (check: Check) => {
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
    searchParams.set('checkType', checkType);

    return `${getRoute(AppRoutes.NewCheck)}/${checkTypeGroup}?${searchParams.toString()}`;
  };

  return {
    duplicateCheckUrl,
  };
}
