import React, { createContext, PropsWithChildren, useCallback, useId, useMemo, useState } from 'react';
import { FieldErrors, FieldValues, useFormContext } from 'react-hook-form';
import { uniq } from 'lodash';

import { Section } from '../FormLayouts/Layout.types';

import { flattenKeys } from '../CheckForm.utils';
import { normalizeFlattenedErrors } from './formlayout.utils';

interface FormLayoutContextValue<T extends FieldValues = FieldValues> {
  activeSection: number;
  allSectionsVisited: boolean;
  formId: string;
  getSectionLabel: (stepIndex: number) => string | null;
  goToSection: (index: number) => void;
  isFirstSection: boolean;
  isLastSection: boolean;
  registerSection: (stepIndex: number, label: string, fields?: Section['fields']) => void;
  setActiveSectionByError: (errs: FieldErrors<T>) => void;
  setSubmitDisabled: React.Dispatch<React.SetStateAction<boolean>>;
  setVisited: (visited: number[]) => void;
  stepOrder: Record<number, { label: string; fields?: Section['fields'] }>;
  submitDisabled: boolean;
  visitedSections: number[];
}

export const FormLayoutContext = createContext<FormLayoutContextValue | null>(null);

export function FormLayoutContextProvider({ children }: PropsWithChildren) {
  const [visitedSections, setVisitedSections] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [submitDisabled, setSubmitDisabled] = useState(true); // default to true to prevent flickering

  const {
    formState: { disabled },
  } = useFormContext();

  const setVisited = useCallback(
    (visited: number[]) => {
      if (!disabled) {
        setVisitedSections((prev) => uniq([...prev, ...visited]));
      }
    },
    [disabled]
  );

  const goToSection = useCallback(
    (index: number) => {
      setActiveSection(index);
      const previous = new Array(index).fill(0).map((_, i) => i);
      setVisited(previous);
    },
    [setVisited]
  );

  const handleVisited = useCallback(
    (indices: number[]) => {
      setVisited(indices);
    },
    [setVisited]
  );

  const [stepOrder, setStepOrder] = useState<Record<number, { label: string; fields?: Section['fields'] }>>({});

  const registerSection = useCallback(
    (stepIndex: number, label: string, fields?: Section['fields']) => {
      setStepOrder((prevState) => {
        if (stepIndex in prevState && prevState[stepIndex]?.label === label) {
          return prevState; // No change needed
        }
        return {
          ...prevState,
          [stepIndex]: { label, fields },
        };
      });
    },
    [setStepOrder]
  );

  const setActiveSectionByError = useCallback(
    (errs: FieldErrors) => {
      handleVisited(Object.keys(stepOrder).map((indexKey) => Number(indexKey)));

      const flattenedErrors = normalizeFlattenedErrors(flattenKeys(errs));
      let index = 0;
      const errSection = Object.entries(stepOrder).find(([indexKey, section]) => {
        index = Number(indexKey);
        const fields = section.fields;

        return flattenedErrors.find((errName: string) => {
          return fields?.some((field: string) => errName.startsWith(field));
        });
      });

      if (errSection !== undefined) {
        setActiveSection(index);
      }
    },
    [handleVisited, stepOrder]
  );

  const getSectionLabel = useCallback(
    (sectionIndex: number) => {
      return stepOrder[sectionIndex]?.label ?? null;
    },
    [stepOrder]
  );

  const allSectionsVisited = visitedSections.length === Object.keys(stepOrder).length;
  const isFirstSection = activeSection === 0;
  const isLastSection = activeSection === Object.keys(stepOrder).length - 1;

  const formId = useId();

  const value = useMemo(() => {
    return {
      activeSection,
      allSectionsVisited,
      formId,
      getSectionLabel,
      goToSection,
      isFirstSection,
      isLastSection,
      registerSection,
      setActiveSectionByError,
      setSubmitDisabled,
      setVisited,
      stepOrder,
      submitDisabled,
      visitedSections,
    };
  }, [
    activeSection,
    allSectionsVisited,
    formId,
    getSectionLabel,
    goToSection,
    isFirstSection,
    isLastSection,
    registerSection,
    setActiveSectionByError,
    setSubmitDisabled,
    setVisited,
    stepOrder,
    submitDisabled,
    visitedSections,
  ]);

  return <FormLayoutContext.Provider value={value}>{children}</FormLayoutContext.Provider>;
}

export function useFormLayoutContextExtended() {
  const context = React.useContext(FormLayoutContext);
  if (!context) {
    throw new Error('useFormLayoutContext must be used within a FormLayoutContextProvider');
  }

  return context;
}
