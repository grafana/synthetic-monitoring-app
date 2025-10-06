import { useCallback, useMemo, useState } from 'react';

import { CheckFormFieldPath, FormNavigationState, FormSectionName } from '../types';
import { CheckType } from 'types';

import { flattenKeys } from '../../CheckForm/CheckForm.utils';
import { normalizeFlattenedErrors } from '../../CheckForm/FormLayout/formlayout.utils';
import { FORM_NAVIGATION_SECTION_LABEL_MAP } from '../constants';
import { getFormSectionOrder } from '../utils/form';

type SectionFieldsState = Partial<Record<FormSectionName, CheckFormFieldPath[]>>;

export function useFormNavigationState(checkType: CheckType, initialSection?: FormSectionName): FormNavigationState {
  const sectionOrder = getFormSectionOrder(checkType);
  const [sections, _setSectionsInternal] = useState<unknown[]>([]);
  const [active, _setActive] = useState(initialSection ?? sectionOrder[0]);
  const [sectionFields, setSectionFields] = useState<SectionFieldsState>({});
  // Section progression.
  const [remainingSteps, setRemainingSteps] = useState<FormSectionName[]>(sectionOrder);

  const registerSectionFields = useCallback<FormNavigationState['registerSectionFields']>((sectionName, fields) => {
    setSectionFields((prevState) => {
      return {
        ...prevState,
        [sectionName]: fields,
      };
    });
  }, []);

  const isSeenStep = useCallback<FormNavigationState['isSeenStep']>(
    (section) => {
      return !remainingSteps.includes(section);
    },
    [remainingSteps]
  );

  // TODO: implement!
  const sectionByErrors = useCallback<FormNavigationState['sectionByErrors']>((errors) => {
    const flattenedErrors = normalizeFlattenedErrors(flattenKeys(errors));
    console.log('sectionByErrors changed', flattenedErrors);
  }, []);

  const getSectionFields = useCallback<FormNavigationState['getSectionFields']>(
    (sectionName) => sectionFields[sectionName] ?? [],
    [sectionFields]
  );

  const getSectionLabel = useCallback<FormNavigationState['getSectionLabel']>((sectionName) => {
    return FORM_NAVIGATION_SECTION_LABEL_MAP[sectionName] ?? sectionName;
  }, []);

  const completeAllSteps = useCallback(() => {
    setRemainingSteps([]);
  }, []);

  const stepActions = useMemo(() => {
    const activeIndex = sectionOrder.indexOf(active);
    const previous = sectionOrder[activeIndex - 1];
    const next = sectionOrder[activeIndex + 1];

    return {
      previous: previous ? { name: previous, label: FORM_NAVIGATION_SECTION_LABEL_MAP[previous] } : null,
      next: next ? { name: next, label: FORM_NAVIGATION_SECTION_LABEL_MAP[next] } : null,
    };
  }, [active, sectionOrder]);

  const isStepsComplete = remainingSteps.length === 0;

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
          setRemainingSteps((prevState) => {
            if (!prevState.length) {
              return prevState; // No steps left to take
            }

            let intermediateState: FormSectionName[] | undefined = undefined;
            // Remove active from section order, if present
            if (prevState.includes(active) && sectionName !== active) {
              intermediateState = prevState.filter((item) => item !== active);
            }

            // Remove everything before active step
            intermediateState = intermediateState ?? prevState;
            if (intermediateState.includes(sectionName)) {
              const currentSectionIndex = intermediateState.indexOf(sectionName);
              return intermediateState.slice(currentSectionIndex);
            }

            return intermediateState;
          });

          _setActive(sectionName);
        }
      },
      registerSectionFields,
      sectionByErrors,
      getSectionFields,
      isSeenStep,
      getSectionLabel,
      completeAllSteps,
      stepActions,
      isStepsComplete,
    };
  }, [
    sectionOrder,
    sections,
    active,
    registerSectionFields,
    sectionByErrors,
    getSectionFields,
    isSeenStep,
    getSectionLabel,
    completeAllSteps,
    stepActions,
    isStepsComplete,
  ]);
}
