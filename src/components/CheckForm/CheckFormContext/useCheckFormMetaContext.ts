import { useContext } from 'react';

import { CheckFormContext } from './CheckFormContext';

export function useCheckFormMetaContext() {
  const context = useContext(CheckFormContext);
  if (!context) {
    throw new Error('useCheckFormMetaContext must be used within a CheckFormContextProvider');
  }

  return context;
}
