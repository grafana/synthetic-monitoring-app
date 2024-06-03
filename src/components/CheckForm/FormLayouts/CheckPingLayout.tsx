import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesPing, CheckType } from 'types';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { PingCheckFragment } from 'components/CheckEditor/FormComponents/PingCheckFragment';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const PingCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesPing>>> = {
  [LayoutSection.Check]: [
    {
      label: ``,
      fields: [`settings.ping.ipVersion`, `settings.ping.dontFragment`],
      Component: (
        <>
          <CheckIpVersion checkType={CheckType.PING} name="settings.ping.ipVersion" />
          <PingCheckFragment />
        </>
      ),
    },
  ],
  [LayoutSection.Uptime]: [
    {
      label: ``,
      fields: [`timeout`],
      Component: (
        <>
          <Timeout checkType={CheckType.PING} />
        </>
      ),
    },
  ],
  [LayoutSection.Probes]: [
    {
      label: ``,
      fields: [`publishAdvancedMetrics`],
      Component: (
        <>
          <CheckPublishedAdvanceMetrics />
        </>
      ),
    },
  ],
  [LayoutSection.Labels]: [],
  [LayoutSection.Alerting]: [],
  [LayoutSection.Review]: [],
};
