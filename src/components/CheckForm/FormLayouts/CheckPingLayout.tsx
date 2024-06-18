import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesPing, CheckType } from 'types';
import { PingRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { PingRequest } from 'components/CheckEditor/FormComponents/PingRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

const PING_FIELDS: PingRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.ping.ipVersion`,
  },
  dontFragment: {
    name: `settings.ping.dontFragment`,
  },
};

export const PingCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesPing>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(PING_FIELDS).map((field) => field.name),
    Component: (
      <>
        <PingRequest fields={PING_FIELDS} />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <>
        <Timeout checkType={CheckType.PING} />
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
