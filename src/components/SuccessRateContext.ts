import { createContext } from 'react';

export enum SuccessRateTypes {
  Checks = 'checks',
  Probes = 'probes',
}

export interface SuccessRate {
  [key: number]: number | undefined;
}

export type SuccessRates = {
  [key in SuccessRateTypes]: SuccessRate;
};

interface SuccessRateContextValue {
  values: SuccessRates;
  loading: boolean;
  updateSuccessRate: (type: SuccessRateTypes, id: number, successRate: number | undefined) => void;
}

const values: SuccessRates = {
  checks: {},
  probes: {},
};

const updateSuccessRate = (type: SuccessRateTypes, id: number, successRate: number | undefined) => {
  values[type][id] = successRate;
};

export const SuccessRateContext = createContext<SuccessRateContextValue>({ values, loading: true, updateSuccessRate });
