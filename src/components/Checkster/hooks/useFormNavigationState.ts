import { useMemo, useState } from 'react';

import { CheckType } from '../../../types';
import { FormNavigationState, FormSectionName } from '../types';

import { FORM_NAVIGATION_SECTION_LABEL_MAP } from '../constants';
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
      activeLabel: FORM_NAVIGATION_SECTION_LABEL_MAP[active],
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
