import React, {
  Children,
  createContext,
  isValidElement,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { FieldErrors, FieldValues, useFormContext } from 'react-hook-form';
import { uniq } from 'lodash';

import { flattenKeys } from '../CheckForm.utils';
import { normalizeFlattenedErrors } from './formlayout.utils';
import { FormSection, FormSectionInternal, FormSectionProps } from './FormSection';

interface FormLayoutContextValue<T extends FieldValues = FieldValues> {
  activeSection: number;
  goToSection: (index: number) => void;
  // setActiveSection: React.Dispatch<React.SetStateAction<number>>;
  setVisited: (visited: number[]) => void;
  visitedSections: number[];
  sections: Array<ReactElement<FormSectionProps>>;
  setSections: (elements: ReactNode) => void;
  formSections: Array<ReactElement<FormSectionProps>>;
  setActiveSectionByError: (errs: FieldErrors<T>) => void;
  getOriginalSections: () => ReactNode;
}

export const FormLayoutContext = createContext<FormLayoutContextValue | null>(null);

export function FormLayoutContextProvider({ children }: PropsWithChildren) {
  const [_sections, _setSections] = useState<ReactNode>(null);
  const [visitedSections, setVisitedSections] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const setSections = useCallback(
    (elements: ReactNode) => {
      _setSections((prevState) => {
        if (prevState === null) {
          return elements;
        }

        return prevState;
      });
    },
    [_setSections]
  );

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

  const sections = useMemo(() => {
    let index = -1;

    return (
      Children.map(_sections, (child) => {
        if (!isValidElement(child)) {
          return null;
        }

        if (child.type === FormSection) {
          index++;

          const sectionProps = child.props as Omit<FormSectionProps, 'index' | 'activeSection'>;

          return <FormSectionInternal {...sectionProps} index={index} activeSection={activeSection} />;
        }

        return child;
      }) || []
    );
  }, [activeSection, _sections]);

  const formSections = useMemo(() => sections.filter((section) => section.type === FormSectionInternal), [sections]);

  const handleVisited = useCallback(
    (indices: number[]) => {
      setVisited(indices);
    },
    [setVisited]
  );

  const setActiveSectionByError = useCallback(
    (errs: FieldErrors) => {
      handleVisited(formSections.map((section) => section.props.index));

      const flattenedErrors = normalizeFlattenedErrors(flattenKeys(errs));

      const errSection = formSections?.find((section) => {
        const fields = section.props.fields;

        return flattenedErrors.find((errName: string) => {
          return fields?.some((field: string) => errName.startsWith(field));
        });
      });

      if (errSection !== undefined) {
        setActiveSection(errSection.props.index);
      }
    },
    [handleVisited, formSections, setActiveSection]
  );

  const getOriginalSections = useCallback(() => {
    return _sections;
  }, [_sections]);

  const value = useMemo(
    () => ({
      activeSection,
      goToSection,
      // setActiveSection,
      setVisited,
      visitedSections,
      sections,
      setSections,
      formSections,
      setActiveSectionByError,
      getOriginalSections,
    }),
    [
      setSections,
      activeSection,
      goToSection,
      setVisited,
      visitedSections,
      sections,
      formSections,
      setActiveSectionByError,
      getOriginalSections,
    ]
  );

  return <FormLayoutContext.Provider value={value}>{children}</FormLayoutContext.Provider>;
}

export function useFormLayoutContextExtended(sections?: ReactNode) {
  const context = React.useContext(FormLayoutContext);
  if (!context) {
    throw new Error('useFormLayoutContext must be used within a FormLayoutContextProvider');
  }

  context.setSections(sections);

  return context;
}

export function useSetActiveSectionByError() {
  const context = React.useContext(FormLayoutContext);
  if (!context) {
    throw new Error('useFormLayoutContext must be used within a FormLayoutContextProvider');
  }

  return context.setActiveSectionByError;
}
