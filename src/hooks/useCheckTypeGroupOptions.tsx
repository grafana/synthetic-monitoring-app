import { ReactNode } from 'react';
import { IconName } from '@grafana/data';

import { CheckType, CheckTypeGroup, ROUTES } from 'types';
import { t } from 'components/i18n';
import { getRoute } from 'components/Routing.utils';

import { CHECK_TYPE_OPTIONS, useCheckTypeOptions } from './useCheckTypeOptions';

export type ProtocolOption = {
  label: string;
  tooltip?: ReactNode;
  href?: string;
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
    label: t(`check-group.api-endpoint.title`, 'API Endpoint'),
    description: t(
      `check-group.api-endpoint.desc`,
      'Monitor the availability and performance of a service, website or API with different request types.'
    ),
    value: CheckTypeGroup.ApiTest,
    icon: `heart-rate`,
    protocols: CHECK_TYPE_OPTIONS.filter((option) => option.group === CheckTypeGroup.ApiTest).map((option) => ({
      label: option.label,
      href: `${getRoute(ROUTES.NewCheck)}/${CheckTypeGroup.ApiTest}?checkType=${option.value}`,
    })),
  },
  {
    label: t(`check-group.multi-step.title`, 'Multi Step'),
    description: t(
      `check-group.multi-step.desc`,
      'Run multiple requests in sequence, using the response data from one request to the next.'
    ),
    value: CheckTypeGroup.MultiStep,
    icon: `gf-interpolation-step-after`,
    protocols: [
      {
        label: t(`check-group.protocols.http`, `HTTP`),
        href: `${getRoute(ROUTES.NewCheck)}/${CheckTypeGroup.MultiStep}?checkType=${CheckType.MULTI_HTTP}`,
      },
    ],
  },
  {
    label: t(`check-group.scripted.title`, 'Scripted'),
    description: t(
      `check-group.scripted.desc`,
      'Write a custom script to run any number of requests with custom checks and assertions.'
    ),
    value: CheckTypeGroup.Scripted,
    icon: `k6`,
    protocols: [
      { label: t(`check-group.protocols.http`, `HTTP`) },
      // todo: we don't support these yet
      // { label: `gRPC` },
      { label: t(`check-group.protocols.websockets`, `WebSockets`) },
      // todo: we don't support these yet
      // {
      //   label: `+More`,
      //   tooltip: (
      //     <div>
      //       You can use k6 extensions to add more protocols.{' '}
      //       <TextLink
      //         href={`https://grafana.com/docs/k6/latest/using-k6/protocols/#extend-protocol-support-with-xk6`}
      //         external
      //         variant={`bodySmall`}
      //       >
      //         Extending protocol support
      //       </TextLink>
      //     </div>
      //   ),
      // },
    ],
  },
  {
    label: t(`check-group.browser.title`, 'Browser'),
    description: t(
      `check-group.browser.desc`,
      'Monitor the availability and performance of a website using a real browser.'
    ),
    value: CheckTypeGroup.Browser,
    icon: `globe`,
    protocols: [
      {
        label: t(`check-group.protocols.http`, `HTTP`),
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
