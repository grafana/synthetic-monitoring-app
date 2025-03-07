import React, { createContext, PropsWithChildren, useCallback, useContext, useReducer } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { Check, CheckPageParams } from 'types';
import { useCheck } from 'data/useChecks';

type CheckDrilldownContextValue = {
  check: Check;
  isLoading: boolean;
  isError: boolean;
  viewState: ViewState;
  changeTab: (tab: number) => void;
} | null;

const CheckDrilldownContext = createContext<CheckDrilldownContextValue>(null);

export const CheckDrilldownProvider = ({ children }: PropsWithChildren) => {
  const { id } = useParams<CheckPageParams>();
  const { data = null, isLoading, isError } = useCheck(Number(id));
  const [viewState, dispatchViewState] = useReducer(viewStateReducer, {
    activeTab: 0,
  });

  const changeTab = useCallback(
    (tab: number) => {
      // scroll to bottom of viewport
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      dispatchViewState({ type: 'setActiveTab', payload: tab });
    },
    [dispatchViewState]
  );

  if (!data) {
    return null;
  }

  return (
    <CheckDrilldownContext.Provider value={{ check: data, isLoading, isError, viewState, changeTab }}>
      {children}
    </CheckDrilldownContext.Provider>
  );
};

export function useCheckDrilldown() {
  const context = useContext(CheckDrilldownContext);

  if (!context) {
    throw new Error('useCheckDrilldown must be used within a CheckDrilldownContext');
  }

  return context;
}

type ViewState = {
  activeTab: number;
};

type ViewStateAction = {
  type: 'setActiveTab';
  payload: number;
};

const viewStateReducer = (state: ViewState, action: ViewStateAction) => {
  switch (action.type) {
    case 'setActiveTab':
      return { ...state, activeTab: action.payload };
  }
};
