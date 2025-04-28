import { ReactNode } from 'react';
import { IconName } from '@grafana/data';
import { trackAddCheckTypeButtonClicked } from 'features/tracking/checkCreationEvents';

import { CheckType, CheckTypeGroup, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { CHECK_TYPE_OPTIONS } from './useCheckTypeOptions';
import { useFeatureFlagContext } from './useFeatureFlagContext';

export type ProtocolOption = {
  label: string;
  tooltip?: ReactNode;
  href?: string;
  featureToggle?: FeatureName | undefined;
  onClick?: () => void;
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
    description: 'Monitor service, website, or API availability and performance with different request types.',
    value: CheckTypeGroup.ApiTest,
    icon: `heart-rate`,
    protocols: CHECK_TYPE_OPTIONS.filter((option) => option.group === CheckTypeGroup.ApiTest).map((option) => ({
      label: option.label,
      href: `${getRoute(AppRoutes.NewCheck)}/${CheckTypeGroup.ApiTest}?checkType=${option.value}`,
      featureToggle: option.featureToggle,
      onClick: () => trackAddCheckTypeButtonClicked({ checkTypeGroup: CheckTypeGroup.ApiTest, protocol: option.value }),
    })),
  },
  {
    label: 'Multi Step',
    description: 'Run multiple requests in sequence, using the response data from one request to the next.',
    value: CheckTypeGroup.MultiStep,
    icon: `gf-interpolation-step-after`,
    protocols: [
      {
        label: `HTTP`,
        href: `${getRoute(AppRoutes.NewCheck)}/${CheckTypeGroup.MultiStep}?checkType=${CheckType.MULTI_HTTP}`,
        onClick: () => trackAddCheckTypeButtonClicked({ checkTypeGroup: CheckTypeGroup.MultiStep, protocol: `HTTP` }),
      },
    ],
  },
  {
    label: 'Scripted',
    description: 'Write a custom script to run any number of requests with custom checks and assertions.',
    value: CheckTypeGroup.Scripted,
    icon: `k6`,
    protocols: [
      {
        label: `HTTP`,
        featureToggle: FeatureName.ScriptedChecks,
        href: `${getRoute(AppRoutes.NewCheck)}/${CheckTypeGroup.Scripted}`,
        onClick: () => trackAddCheckTypeButtonClicked({ checkTypeGroup: CheckTypeGroup.Scripted, protocol: `HTTP` }),
      },
      // todo: we don't support these yet
      // { label: `gRPC` },
      { label: `WebSockets`, featureToggle: FeatureName.ScriptedChecks },
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
    label: `Browser`,
    description: `Monitor the availability and performance of a website using a real browser.`,
    value: CheckTypeGroup.Browser,
    icon: `globe`,
    protocols: [
      {
        label: `HTTP`,
        featureToggle: FeatureName.BrowserChecks,
        href: `${getRoute(AppRoutes.NewCheck)}/${CheckTypeGroup.Browser}`,
        onClick: () => trackAddCheckTypeButtonClicked({ checkTypeGroup: CheckTypeGroup.Browser, protocol: `HTTP` }),
      },
    ],
  },
];

export function useCheckTypeGroupOptions() {
  const { isFeatureEnabled } = useFeatureFlagContext();

  return CHECK_TYPE_GROUP_OPTIONS.map((option) => {
    const protocols = option.protocols.filter((protocol) =>
      protocol.featureToggle ? isFeatureEnabled(protocol.featureToggle) : true
    );

    return {
      ...option,
      protocols,
    };
  }).filter((option) => option.protocols.length > 0);
}

export function useCheckTypeGroupOption(checkTypeGroup?: CheckTypeGroup) {
  return useCheckTypeGroupOptions().find(({ value }) => value === checkTypeGroup);
}
