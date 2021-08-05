import { createContext } from 'react';

export enum SuccessRateTypes {
  Checks = 'checks',
  Probes = 'probes',
}

export interface SuccessRateValue {
  reachabilityValue: number;
  reachabilityDisplayValue: string;
  noData?: boolean;
  uptimeValue?: number;
  uptimeDisplayValue?: string;
}

export interface ThresholdValues {
  upperLimit: number;
  lowerLimit: number;
}
export interface ThresholdSettings {
  [key: string]: ThresholdValues;
  uptime: ThresholdValues;
  reachability: ThresholdValues;
  latency: ThresholdValues;
}
export interface SuccessRate {
  [key: number]: SuccessRateValue;
}

type SuccessRatesByType = {
  [key in SuccessRateTypes]: SuccessRate;
};

export interface SuccessRates extends SuccessRatesByType {
  defaults: SuccessRateValue;
}

interface SuccessRateContextValue {
  values: SuccessRates;
  loading: boolean;
  thresholds: ThresholdSettings;
  updateSuccessRate: (type: SuccessRateTypes, id: number, successRate: number | undefined) => void;
  updateThresholds: () => void;
}

export const defaultValues: SuccessRates = {
  checks: {},
  probes: {},
  defaults: {
    reachabilityValue: 0,
    reachabilityDisplayValue: 'N/A',
    noData: true,
    uptimeValue: 0,
    uptimeDisplayValue: 'N/A',
  },
};

export const defaultThresholds: ThresholdSettings = {
  uptime: {
    upperLimit: 90,
    lowerLimit: 75,
  },
  reachability: {
    upperLimit: 90,
    lowerLimit: 75,
  },
  latency: {
    upperLimit: 1000,
    lowerLimit: 200,
  },
};

const updateThresholds = () => {};

const updateSuccessRate = (type: SuccessRateTypes, id: number, successRate: number | undefined) => {
  defaultValues[type][id] = {
    reachabilityValue: successRate ?? 0,
    reachabilityDisplayValue: successRate === undefined ? 'N/A' : successRate.toFixed(1),
    noData: successRate === undefined,
    uptimeValue: 0,
    uptimeDisplayValue: 'N/A',
  };
};

export const SuccessRateContext = createContext<SuccessRateContextValue>({
  values: defaultValues,
  loading: true,
  updateSuccessRate,
  thresholds: defaultThresholds,
  updateThresholds,
});
