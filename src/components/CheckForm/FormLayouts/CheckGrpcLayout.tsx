import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesGRPC, CheckType } from 'types';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckUseTLS } from 'components/CheckEditor/FormComponents/CheckUseTLS';
import { GRPCCheckService } from 'components/CheckEditor/FormComponents/GRPCCheckService';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';
import { TLSConfig } from 'components/TLSConfig';

export const GRPCCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesGRPC>>> = {
  [LayoutSection.Check]: [
    {
      label: `Request Options`,
      fields: [`settings.grpc.ipVersion`],
      Component: (
        <>
          <CheckIpVersion checkType={CheckType.GRPC} name="settings.grpc.ipVersion" />
        </>
      ),
    },
    {
      label: `Service`,
      fields: [`settings.grpc.service`],
      Component: (
        <>
          <GRPCCheckService />
        </>
      ),
    },
    {
      label: `TLS Config`,
      fields: [`settings.grpc.tls`, `settings.grpc.tlsConfig`],
      Component: (
        <>
          <CheckUseTLS checkType={CheckType.GRPC} />
          <TLSConfig checkType={CheckType.GRPC} />
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
          <Timeout checkType={CheckType.GRPC} />
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
