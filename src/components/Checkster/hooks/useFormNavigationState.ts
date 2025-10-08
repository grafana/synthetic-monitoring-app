import { useCallback, useEffect, useMemo, useState } from 'react';
import { FieldErrors } from 'react-hook-form';

import { CheckFormFieldPath, FormNavigationState, FormSectionName } from '../types';
import { CheckFormValues, CheckType } from 'types';

import { FORM_NAVIGATION_SECTION_LABEL_MAP } from '../constants';
import { getFormSectionOrder } from '../utils/form';
import { flattenKeys, getHasSectionError } from '../utils/navigation';

type SectionFieldsState = Partial<Record<FormSectionName, CheckFormFieldPath[]>>;

export function useFormNavigationState(
  checkType: CheckType,
  formErrors: FieldErrors<CheckFormValues>,
  initialSection?: FormSectionName
): FormNavigationState {
  const sectionOrder = getFormSectionOrder(checkType);
  const [sections, _setSectionsInternal] = useState<unknown[]>([]);
  const [active, _setActive] = useState(initialSection ?? sectionOrder[0]);
  const [sectionFields, setSectionFields] = useState<SectionFieldsState>({});
  const [errors, setErrors] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    const newErrors = flattenKeys(formErrors);
    const hasErrors = newErrors.length > 0;
    setErrors(hasErrors ? newErrors : undefined);
    // Means that form has been submitted or trigger has run on the whole form
    hasErrors && setRemainingSteps([]);
  }, [formErrors]);

  // Section progression.
  const [remainingSteps, setRemainingSteps] = useState<FormSectionName[]>(sectionOrder);

  const registerSectionFields = useCallback<FormNavigationState['registerSectionFields']>((sectionName, fields) => {
    setSectionFields((prevState) => {
      if (sectionName in prevState && prevState[sectionName] === fields) {
        return prevState;
      }

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

  const getSectionFields = useCallback<FormNavigationState['getSectionFields']>(
    (sectionName) => sectionFields[sectionName] ?? [],
    [sectionFields]
  );

  const sectionByErrors = useCallback<FormNavigationState['sectionByErrors']>(
    (_errors) => {
      let flattenedErrors = errors;
      if (_errors) {
        flattenedErrors = Array.isArray(_errors) ? _errors : flattenKeys(_errors);
      }

      if (!flattenedErrors) {
        return;
      }

      for (const section of sectionOrder) {
        const sectionFields = getSectionFields(section);
        if (getHasSectionError(sectionFields, flattenedErrors)) {
          _setActive(section);
          return;
        } else {
          if (process.env.NODE_ENV === 'development') {
            // Only for development
            console.warn('unhandled section field', flattenedErrors);
          }
        }
      }
    },
    [errors, getSectionFields, sectionOrder]
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
      errors,
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
    errors,
  ]);
}
