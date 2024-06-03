import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesDns, CheckType } from 'types';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { DNSCheckRecordPort } from 'components/CheckEditor/FormComponents/DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from 'components/CheckEditor/FormComponents/DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from 'components/CheckEditor/FormComponents/DNSCheckRecordServer';
import { DNSCheckRecordType } from 'components/CheckEditor/FormComponents/DNSCheckRecordType';
import { DNSCheckResponseMatches } from 'components/CheckEditor/FormComponents/DNSCheckResponseMatches';
import { DNSCheckValidResponseCodes } from 'components/CheckEditor/FormComponents/DNSCheckValidResponseCodes';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const DNSCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesDns>>> = {
  [LayoutSection.Check]: [
    {
      label: `Request Options`,
      fields: [`settings.dns.ipVersion`],
      Component: (
        <>
          <CheckIpVersion checkType={CheckType.DNS} name="settings.dns.ipVersion" />
        </>
      ),
    },
    {
      label: `DNS Settings`,
      fields: [`settings.dns.recordType`, `settings.dns.server`, `settings.dns.protocol`, `settings.dns.port`],
      Component: (
        <>
          <DNSCheckRecordType />
          <DNSCheckRecordServer />
          <DNSCheckRecordProtocol />
          <DNSCheckRecordPort />
        </>
      ),
    },
  ],
  [LayoutSection.Uptime]: [
    {
      label: ``,
      fields: [`settings.dns.validRCodes`, `settings.dns.validations`],
      Component: (
        <>
          <DNSCheckValidResponseCodes />
          <DNSCheckResponseMatches />
          <Timeout checkType={CheckType.DNS} />
        </>
      ),
    },
  ],
  [LayoutSection.Probes]: [
    {
      label: ``,
      fields: [],
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
