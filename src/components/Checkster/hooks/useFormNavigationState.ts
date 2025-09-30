import { useMemo, useState } from 'react';

import { CheckType } from '../../../types';
import { FormNavigationState, FormSectionName } from '../types';

import { getFormSectionOrder } from '../utils/form';

export function useFormNavigationState(checkType: CheckType): FormNavigationState {
  const sectionOrder = getFormSectionOrder(checkType);
  const [sections, _setSectionsInternal] = useState<unknown[]>([]);
  const [active, _setActive] = useState(sectionOrder[0]);

  return useMemo(() => {
    return {
      sectionOrder,
      sections,
      active,
      isSectionActive(sectionName: FormSectionName) {
        return sectionName === active;
      },
      setSectionActive(sectionName: FormSectionName) {
        if (sectionOrder.includes(sectionName)) {
          _setActive(sectionName);
        }
      },
    };
  }, [sectionOrder, sections, active]);
}
