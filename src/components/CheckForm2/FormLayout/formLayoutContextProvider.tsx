import React, { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { uniq } from 'lodash';

type LayoutFormContextType = {
  activeSection: number;
  goToSection: (index: number) => void;
  setActiveSection: (index: number) => void;
  setVisited: (index: number[]) => void;
  visitedSections: number[];
};

export const FormLayoutContext = createContext<LayoutFormContextType>({
  activeSection: 0,
  goToSection: () => {},
  setActiveSection: () => {},
  setVisited: () => {},
  visitedSections: [],
});

export const FormLayoutContextProvider = ({ children }: { children: ReactNode }) => {
  const [visitedSections, setVisitedSections] = useState<number[]>([]);
  const [activeSection, setActiveSection] = useState(0);

  const setVisited = useCallback((visited: number[]) => {
    setVisitedSections((prev) => uniq([...prev, ...visited]));
  }, []);

  const goToSection = useCallback(
    (index: number) => {
      setActiveSection(index);
      const previous = new Array(index).fill(0).map((_, i) => i);
      setVisited(previous);
    },
    [setVisited]
  );

  const value = useMemo(() => {
    return {
      activeSection,
      goToSection,
      setActiveSection,
      setVisited,
      visitedSections,
    };
  }, [activeSection, goToSection, visitedSections, setVisited]);

  return <FormLayoutContext.Provider value={value}>{children}</FormLayoutContext.Provider>;
};

export const useFormLayoutContext = () => {
  const context = useContext(FormLayoutContext);

  if (context === undefined) {
    throw new Error('useFormLayoutContext must be used within a ActivityPanelContextProvider');
  }

  return context;
};
