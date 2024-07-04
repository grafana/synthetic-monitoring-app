import React, { ReactNode } from 'react';
import { IconName } from '@grafana/data';
import { TextLink } from '@grafana/ui';

import { CheckTypeGroup } from 'types';

import { CHECK_TYPE_OPTIONS, useCheckTypeOptions } from './useCheckTypeOptions';

export type ProtocolOption = {
  label: string;
  tooltip?: ReactNode;
};

export interface CheckTypeGroupOption {
  label: string;
  description: string;
  value: CheckTypeGroup;
  icon: IconName;
  protocols: ProtocolOption[];
}

export const CHECK_TYPE_GROUP_OPTIONS: CheckTypeGroupOption[] = [
  {
    label: 'API Endpoint',
    description: 'Monitor the availability and performance of a service, website or API with different request types.',
    value: CheckTypeGroup.ApiTest,
    icon: `heart-rate`,
    protocols: CHECK_TYPE_OPTIONS.filter((option) => option.group === CheckTypeGroup.ApiTest).map((option) => ({
      label: option.label,
    })),
  },
  {
    label: 'Multi Step',
    description: 'Run multiple requests in sequence, using the response data from one request to the next.',
    value: CheckTypeGroup.MultiStep,
    icon: `gf-interpolation-step-after`,
    protocols: [{ label: `HTTP` }],
  },
  {
    label: 'Scripted',
    description: 'Write a custom script to run any number of requests with custom checks and assertions.',
    value: CheckTypeGroup.Scripted,
    icon: `k6`,
    protocols: [
      { label: `HTTP` },
      { label: `gRPC` },
      { label: `WebSockets` },
      {
        label: `+More`,
        tooltip: (
          <div>
            You can use k6 extensions to add more protocols.{' '}
            <TextLink
              href={`https://grafana.com/docs/k6/latest/using-k6/protocols/#extend-protocol-support-with-xk6`}
              external
              variant={`bodySmall`}
            >
              Extending protocol support
            </TextLink>
          </div>
        ),
      },
    ],
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
