import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTraceroute, CheckType } from 'types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TracerouteMaxHops } from 'components/CheckEditor/FormComponents/TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from 'components/CheckEditor/FormComponents/TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from 'components/CheckEditor/FormComponents/TraceroutePTRLookup';

export const TracerouteCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesTraceroute>>> = {
  [LayoutSection.Check]: [
    {
      label: ``,
      fields: [`settings.traceroute.maxHops`, `settings.traceroute.maxUnknownHops`, `settings.traceroute.ptrLookup`],
      Component: (
        <div>
          <TracerouteMaxHops />
          <TracerouteMaxUnknownHops />
          <TraceroutePTRLookup />
        </div>
      ),
    },
  ],
  [LayoutSection.Uptime]: [
    {
      label: ``,
      fields: [`timeout`],
      Component: (
        <>
          <Timeout checkType={CheckType.Traceroute} />
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
