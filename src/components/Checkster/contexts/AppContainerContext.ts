import { createContext, CSSProperties, RefObject, useContext } from 'react';

interface SplitterComponentProps {
  ref: RefObject<HTMLDivElement | null>;
  className: string;
  style?: CSSProperties;
}

export const AppContainerContext = createContext<{
  containerProps: SplitterComponentProps;
  primaryProps: SplitterComponentProps;
  secondaryProps: SplitterComponentProps;
  splitterProps: SplitterComponentProps;
} | null>(null);

export const AppContainerProvider = AppContainerContext.Provider;

export function useAppContainerContext() {
  const context = useContext(AppContainerContext);
  if (!context) {
    throw new Error('useAppContainerContext must be used within an AppContainerProvider');
  }

  return context;
}
