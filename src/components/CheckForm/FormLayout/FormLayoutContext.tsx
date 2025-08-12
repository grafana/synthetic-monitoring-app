import React, { createContext, PropsWithChildren, useCallback, useMemo, useState } from 'react';
import { FieldErrors, FieldValues, useFormContext } from 'react-hook-form';
import { uniq } from 'lodash';

import { Section } from '../FormLayouts/Layout.types';

import { flattenKeys } from '../CheckForm.utils';
import { normalizeFlattenedErrors } from './formlayout.utils';

interface FormLayoutContextValue<T extends FieldValues = FieldValues> {
  activeSection: number;
  goToSection: (index: number) => void;
  // setActiveSection: React.Dispatch<React.SetStateAction<number>>;
  setVisited: (visited: number[]) => void;
  visitedSections: number[];
  setActiveSectionByError: (errs: FieldErrors<T>) => void;
  registerSection: (stepIndex: number, label: string, fields?: Section['fields']) => void;
  stepOrder: Record<number, { label: string; fields?: Section['fields'] }>;
  getSectionLabel: (stepIndex: number) => string | null;
}

export const FormLayoutContext = createContext<FormLayoutContextValue | null>(null);

export function FormLayoutContextProvider({ children }: PropsWithChildren) {
  const [visitedSections, setVisitedSections] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);

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

  const value = useMemo(() => {
    return {
      activeSection,
      goToSection,
      // setActiveSection,
      setVisited,
      visitedSections,

      setActiveSectionByError,

      registerSection,
      stepOrder,
      getSectionLabel,
    };
  }, [
    activeSection,
    goToSection,
    setVisited,
    visitedSections,

    setActiveSectionByError,
    registerSection,
    stepOrder,
    getSectionLabel,
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
