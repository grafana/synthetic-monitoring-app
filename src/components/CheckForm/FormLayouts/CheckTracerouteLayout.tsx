import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTraceroute, CheckType } from 'types';
import { TracerouteRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TracerouteRequest } from 'components/CheckEditor/FormComponents/TracerouteRequest';

const TRACEROUTE_FIELDS: TracerouteRequestFields = {
  target: {
    name: `target`,
  },
  maxHops: {
    name: `settings.traceroute.maxHops`,
  },
  maxUnknownHops: {
    name: `settings.traceroute.maxUnknownHops`,
  },
  ptrLookup: {
    name: `settings.traceroute.ptrLookup`,
  },
};

export const TracerouteCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesTraceroute>>> = {
  [LayoutSection.Check]: {
    fields: [`settings.traceroute.maxHops`, `settings.traceroute.maxUnknownHops`, `settings.traceroute.ptrLookup`],
    Component: (
      <div>
        <TracerouteRequest fields={TRACEROUTE_FIELDS} />
      </div>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <>
        <Timeout checkType={CheckType.Traceroute} />
      </>
    ),
  },
  [LayoutSection.Probes]: {
    fields: [`publishAdvancedMetrics`],
    Component: (
      <>
        <CheckPublishedAdvanceMetrics />
      </>
    ),
  },
};
