import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTcp, CheckType } from 'types';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckUseTLS } from 'components/CheckEditor/FormComponents/CheckUseTLS';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TLSConfig } from 'components/TLSConfig';

export const TCPCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesTcp>>> = {
  [LayoutSection.Check]: [
    {
      label: `Request Options`,
      fields: [`settings.tcp.ipVersion`],
      Component: (
        <>
          <CheckIpVersion checkType={CheckType.TCP} name="settings.tcp.ipVersion" />
        </>
      ),
    },
    {
      label: `TLS Config`,
      fields: [`settings.tcp.tls`, `settings.tcp.tlsConfig`],
      Component: (
        <>
          <CheckUseTLS checkType={CheckType.TCP} />
          <TLSConfig checkType={CheckType.TCP} />
        </>
      ),
    },
  ],
  [LayoutSection.Uptime]: [
    {
      label: ``,
      fields: [`settings.tcp.queryResponse`, `timeout`],
      Component: (
        <>
          <TCPCheckQueryAndResponse />
          <Timeout checkType={CheckType.TCP} />
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
