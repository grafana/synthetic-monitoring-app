import React, { Children, createContext, ReactNode, useContext, useMemo, useReducer } from 'react';

export type SectionState = {
  active: boolean;
};

type ContextProps = null | {
  state: [SectionState[], React.Dispatch<{ index: number; state: SectionState }>];
  // sectionState: SectionState[];
  // updateSectionState: React.Dispatch<{ index: number; state: SectionState }>;
};

const FormLayoutContext = createContext<ContextProps>(null);

export function useFormLayoutContext() {
  const context = useContext(FormLayoutContext);

  if (!context) {
    throw new Error('useFormLayoutContext must be used within a FormLayoutContext.Provider');
  }

  return context;
}

export const FormLayoutContextProvider = ({ children }: { children: ReactNode }) => {
  const initialState = useMemo(() => {
    const sections = Children.toArray(children);

    return sections.map<SectionState>((_, index) => ({
      active: index === 0,
    }));
  }, [children]);
  const state = useReducer(reducer, initialState);

  return <FormLayoutContext.Provider value={{ state }}>{children}</FormLayoutContext.Provider>;
};

function reducer(state: SectionState[], payload: { index: number; state: SectionState }) {
  const newState = [...state];
  newState[payload.index] = payload.state;

  return newState;
}
