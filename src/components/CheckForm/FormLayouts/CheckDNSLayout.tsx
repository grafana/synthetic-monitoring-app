import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesDns, CheckType } from 'types';
import { DNSRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { DNSCheckResponseMatches } from 'components/CheckEditor/FormComponents/DNSCheckResponseMatches';
import { DNSCheckValidResponseCodes } from 'components/CheckEditor/FormComponents/DNSCheckValidResponseCodes';
import { DNSRequest } from 'components/CheckEditor/FormComponents/DNSRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

const DNS_REQUEST_FIELDS: DNSRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.dns.ipVersion`,
  },
  recordType: {
    name: `settings.dns.recordType`,
  },
  server: {
    name: `settings.dns.server`,
  },
  protocol: {
    name: `settings.dns.protocol`,
  },
  port: {
    name: `settings.dns.port`,
  },
};

export const DNSCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesDns>>> = {
  [LayoutSection.Check]: {
    fields: [`target`],
    Component: (
      <>
        <DNSRequest fields={DNS_REQUEST_FIELDS} />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`settings.dns.validRCodes`, `settings.dns.validations`],
    Component: (
      <>
        <DNSCheckValidResponseCodes />
        <DNSCheckResponseMatches />
        <Timeout checkType={CheckType.DNS} />
      </>
    ),
  },

  [LayoutSection.Probes]: {
    fields: [],
    Component: (
      <>
        <CheckPublishedAdvanceMetrics />
      </>
    ),
  },
};
