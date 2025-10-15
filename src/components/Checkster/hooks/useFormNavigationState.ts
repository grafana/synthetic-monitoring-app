import { useCallback, useEffect, useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CheckFormFieldPath, FormNavigationState, FormSectionName } from '../types';
import { CheckFormValues, CheckType } from 'types';

import { FORM_NAVIGATION_SECTION_LABEL_MAP } from '../constants';
import { getFlattenErrors, getFormSectionOrder } from '../utils/form';
import { getHasSectionError } from '../utils/navigation';

type SectionFieldsState = Partial<Record<FormSectionName, CheckFormFieldPath[]>>;

export function useFormNavigationState(
  checkType: CheckType,
  formMethods: UseFormReturn<CheckFormValues>,
  initialSection?: FormSectionName
): FormNavigationState {
  const sectionOrder = getFormSectionOrder(checkType);
  const [sections, _setSectionsInternal] = useState<unknown[]>([]);
  const [active, _setActive] = useState(initialSection ?? sectionOrder[0]);
  const [sectionFields, setSectionFields] = useState<SectionFieldsState>({});
  const [errors, setErrors] = useState<string[] | undefined>(undefined);
  const [labelMap, setLabelMap] = useState<Record<FormSectionName, string>>(FORM_NAVIGATION_SECTION_LABEL_MAP);
  const { submitCount, errors: formErrors } = formMethods.formState;

  useEffect(() => {
    const newErrors = getFlattenErrors(formErrors);
    const hasErrors = newErrors.length > 0;
    if (hasErrors) {
      setErrors(hasErrors ? newErrors : undefined);
    }

    if (submitCount <= 0) {
      return;
    }

    setRemainingSteps([]);
  }, [submitCount, formErrors]);

  // Section progression.
  const [remainingSteps, setRemainingSteps] = useState<FormSectionName[]>(sectionOrder);

  const registerSection = useCallback<FormNavigationState['registerSection']>(
    (sectionName, fields, navLabel) => {
      setSectionFields((prevState) => {
        if (sectionName in prevState && prevState[sectionName] === fields) {
          return prevState;
        }

        return {
          ...prevState,
          [sectionName]: fields,
        };
      });
      // Override default nav label (which is the enum key of FormSectionName)
      // Mainly used for the `check` section
      if (navLabel) {
        setLabelMap((prevState) => {
          if (sectionName in labelMap && labelMap[sectionName] === navLabel) {
            return prevState;
          }
          return {
            ...prevState,
            [sectionName]: navLabel,
          };
        });
      }
    },
    [labelMap]
  );

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
        flattenedErrors = Array.isArray(_errors) ? _errors : getFlattenErrors(_errors);
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

  const getSectionLabel = useCallback<FormNavigationState['getSectionLabel']>(
    (sectionName) => {
      return labelMap[sectionName] ?? sectionName;
    },
    [labelMap]
  );

  const completeAllSteps = useCallback(() => {
    setRemainingSteps([]);
  }, []);

  const stepActions = useMemo(() => {
    const activeIndex = sectionOrder.indexOf(active);
    const previous = sectionOrder[activeIndex - 1];
    const next = sectionOrder[activeIndex + 1];

    return {
      previous: previous ? { name: previous, label: labelMap[previous] } : null,
      next: next ? { name: next, label: labelMap[next] } : null,
    };
  }, [active, sectionOrder, labelMap]);

  const isStepsComplete = remainingSteps.length === 0;

  return useMemo(() => {
    return {
      sectionOrder,
      sections,
      active,
      activeLabel: getSectionLabel(active),
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
      registerSection,
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
    registerSection,
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
