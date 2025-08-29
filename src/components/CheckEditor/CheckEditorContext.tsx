import React, {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react';
import { FieldErrors, FieldValues, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { uniq } from 'lodash';

import { AdHocCheckResponse } from '../../datasource/responses.types';
import { Section } from '../CheckForm/FormLayouts/Layout.types';
import { Check, CheckFormValues, CheckType, CheckTypeGroup } from 'types';

import { FormSectionIndex } from './CheckEditor.constants';
import { useCheckEditorCheckMeta } from './CheckEditor.hooks';
import { flattenKeys, normalizeFlattenedErrors } from './CheckEditor.utils';

interface CheckEditorContextValue<T extends FieldValues = FieldValues> {
  checkMeta: ReturnType<typeof useCheckEditorCheckMeta>;

  // form stuff
  formId: string;

  // Adhoc stuff
  adhocCheckResponse?: AdHocCheckResponse | null;
  adhocCheckResponseError?: Error | null;
  setAdhocCheckResponseError: Dispatch<SetStateAction<Error | undefined | null>>;
  setAdhocCheckResponse: Dispatch<SetStateAction<AdHocCheckResponse | undefined | null>>;

  // Section/nav stuff
  initialSectionIndex: FormSectionIndex;
  activeSection: FormSectionIndex;
  allSectionsVisited: boolean;
  registerSection: (stepIndex: FormSectionIndex, label: string, fields?: Section['fields']) => void;
  getSectionLabel: (stepIndex: FormSectionIndex) => string | null;
  goToSection: (index: FormSectionIndex) => void;
  isFirstSection: boolean;
  isLastSection: boolean;
  setActiveSectionByError: (errs: FieldErrors<T>) => void;
  setSubmitDisabled: Dispatch<SetStateAction<boolean>>;
  setVisited: (visited: FormSectionIndex[]) => void;
  visitedSections: FormSectionIndex[];
  stepOrder: Record<FormSectionIndex, { label: string; fields?: Section['fields'] }>;
  submitDisabled: boolean;
}

export const CheckEditorContext = createContext<CheckEditorContextValue | null>(null);

export interface CheckEditorContextProviderProps {
  check?: Check;
  checkTypeGroup?: CheckTypeGroup | string | null;
  checkType?: CheckType | string | null;
  disabled?: boolean;
  initialSectionIndex?: FormSectionIndex;
}

export function CheckEditorContextProvider({
  check,
  checkType,
  checkTypeGroup,
  disabled,
  children,
  initialSectionIndex = 0,
}: PropsWithChildren<CheckEditorContextProviderProps>) {
  // Form stuff
  const formId = useId();
  const [submitDisabled, setSubmitDisabled] = useState(true); // default to true to prevent flickering

  // Create useAdhocCheckResponse hook to manage adhoc check response state
  const [adhocCheckResponse, setAdhocCheckResponse] = useState<AdHocCheckResponse | null>();
  const [adhocCheckResponseError, setAdhocCheckResponseError] = useState<Error | null>();

  // Section/nav states
  const [activeSection, setActiveSection] = useState(initialSectionIndex);
  const [visitedSections, setVisitedSections] = useState<number[]>([]);
  const [stepOrder, setStepOrder] = useState<Record<FormSectionIndex, { label: string; fields?: Section['fields'] }>>(
    {}
  );
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

  const allSectionsVisited = visitedSections.length === Object.keys(stepOrder).length;
  const getSectionLabel = useCallback(
    (sectionIndex: FormSectionIndex) => {
      return stepOrder[sectionIndex]?.label ?? null;
    },
    [stepOrder]
  );
  const setVisited = useCallback(
    (visited: FormSectionIndex[]) => {
      if (!disabled) {
        // @todo: try to not mutate if possible
        setVisitedSections((prev) => uniq([...prev, ...visited]));
      }
    },
    [disabled]
  );
  const goToSection = useCallback(
    (index: FormSectionIndex) => {
      const previous = new Array(index).fill(0).map((_, i) => i);
      setVisited([...previous, activeSection]);
      setActiveSection(index);
    },
    [activeSection, setVisited]
  );
  const isFirstSection = activeSection === 0;
  const isLastSection = activeSection === Object.keys(stepOrder).length - 1;
  const setActiveSectionByError = useCallback(
    (errs: FieldErrors) => {
      setVisited(Object.keys(stepOrder).map((indexKey) => Number(indexKey)));

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
    [setVisited, stepOrder]
  );

  // Check meta is used to get the form schema and default values
  const checkMeta = useCheckEditorCheckMeta(check, checkType ?? checkTypeGroup);

  // Create form methods using the check meta and disabled state
  const formMethods = useForm<CheckFormValues>({
    disabled: disabled || checkMeta.isDisabled,
    defaultValues: checkMeta.defaultFormValues,
    shouldFocusError: false, // we manage focus manually
    resolver: zodResolver(checkMeta.schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  // Create context value using the form methods and check meta
  const value = useMemo(() => {
    return {
      activeSection,
      adhocCheckResponse,
      adhocCheckResponseError,
      allSectionsVisited,
      checkMeta,
      formId,
      getSectionLabel,
      goToSection,
      initialSectionIndex,
      isFirstSection,
      isLastSection,
      registerSection,
      setActiveSectionByError,
      setAdhocCheckResponse,
      setAdhocCheckResponseError,
      setSubmitDisabled,
      setVisited,
      stepOrder,
      submitDisabled,
      visitedSections,
    };
  }, [
    activeSection,
    adhocCheckResponse,
    adhocCheckResponseError,
    allSectionsVisited,
    checkMeta,
    formId,
    getSectionLabel,
    goToSection,
    initialSectionIndex,
    isFirstSection,
    isLastSection,
    registerSection,
    setActiveSectionByError,
    setVisited,
    stepOrder,
    submitDisabled,
    visitedSections,
  ]);

  return (
    <CheckEditorContext.Provider value={value}>
      <FormProvider {...formMethods}>{children}</FormProvider>
    </CheckEditorContext.Provider>
  );
}

export function useCheckEditorContext() {
  const context = useContext(CheckEditorContext);
  if (!context) {
    throw new Error('useCheckEditorContext must be used within a CheckEditorContextProvider');
  }

  return context;
}
