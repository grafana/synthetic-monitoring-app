import { config } from '@grafana/runtime';
import { createContext } from 'react';
import { getSuccessRateThresholdColor } from 'utils';

export enum SuccessRateTypes {
  Checks = 'checks',
  Probes = 'probes',
}

export interface SuccessRateValue {
  value: number;
  displayValue: string;
  thresholdColor: string;
  noData?: boolean;
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
  updateSuccessRate: (type: SuccessRateTypes, id: number, successRate: number | undefined) => void;
}

export const defaultValues: SuccessRates = {
  checks: {},
  probes: {},
  defaults: {
    thresholdColor: config.theme2.colors.text.disabled,
    value: 0,
    displayValue: 'N/A',
    noData: true,
  },
};

const updateSuccessRate = (type: SuccessRateTypes, id: number, successRate: number | undefined) => {
  const thresholdColor = getSuccessRateThresholdColor(successRate);

  defaultValues[type][id] = {
    value: successRate ?? 0,
    displayValue: successRate === undefined ? 'N/A' : successRate.toFixed(1),
    thresholdColor,
    noData: successRate === undefined,
  };
};

export const SuccessRateContext = createContext<SuccessRateContextValue>({
  values: defaultValues,
  loading: true,
  updateSuccessRate,
});
