import React, { PropsWithChildren } from 'react';
import { SuccessRates, SuccessRateContext, SuccessRateTypes } from './SuccessRateContext';

interface Props {}

const values: SuccessRates = {
  checks: {},
  probes: {},
};

const updateSuccessRate = (type: SuccessRateTypes, id: number, successRate: number | undefined) => {
  if (!id) {
    return;
  }

  values[type][id] = successRate;
};

export function SuccessRateContextProvider({ children }: PropsWithChildren<Props>) {
  return <SuccessRateContext.Provider value={{ values, updateSuccessRate }}>{children}</SuccessRateContext.Provider>;
}
