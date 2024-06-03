import { IconName } from '@grafana/data';

import { CheckTypeGroup } from 'types';

import { useCheckTypeOptions } from './useCheckTypeOptions';

interface CheckTypeGroupOption {
  label: string;
  description: string;
  value: CheckTypeGroup;
  icon: IconName;
}

const CHECK_TYPE_GROUP_OPTIONS: CheckTypeGroupOption[] = [
  {
    label: 'API Test',
    description: 'Test the availability and performance of your API endpoints.',
    value: CheckTypeGroup.ApiTest,
    icon: `heart-rate`,
  },
  {
    label: 'Multi Step',
    description: 'Run multiple requests in sequence.',
    value: CheckTypeGroup.MultiStep,
    icon: `gf-interpolation-step-after`,
  },
  {
    label: 'Scripted',
    description: 'Write custom checks with k6 scripts.',
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
