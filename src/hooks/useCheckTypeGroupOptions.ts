import { IconName } from '@grafana/data';

import { CheckTypeGroup } from 'types';

import { useCheckTypeOptions } from './useCheckTypeOptions';

interface CheckTypeGroupOption {
  label: string;
  description: string;
  value: CheckTypeGroup;
  icon: IconName;
}

export const CHECK_TYPE_GROUP_OPTIONS: CheckTypeGroupOption[] = [
  {
    label: 'API Endpoint',
    description: 'Monitor the availability and performance of a service, website or API with different request types.',
    value: CheckTypeGroup.ApiTest,
    icon: `heart-rate`,
  },
  {
    label: 'Multi Step',
    description: 'Run multiple requests in sequence, using the response data from one request to the next.',
    value: CheckTypeGroup.MultiStep,
    icon: `gf-interpolation-step-after`,
  },
  {
    label: 'Scripted',
    description: 'Write a custom script to run any number of requests with custom checks and assertions.',
    value: CheckTypeGroup.Scripted,
    icon: `k6`,
  },
];

export function useCheckTypeGroupOptions() {
  const groups = useCheckTypeOptions().reduce<CheckTypeGroup[]>((acc, option) => {
    const group = option.group;

    if (acc.includes(group)) {
      return acc;
    }

    return [...acc, group];
  }, []);

  return CHECK_TYPE_GROUP_OPTIONS.filter((option) => groups.includes(option.value));
}
