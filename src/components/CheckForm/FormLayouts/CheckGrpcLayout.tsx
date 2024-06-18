import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesGRPC, CheckType } from 'types';
import { GRPCRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { GRPCRequest } from 'components/CheckEditor/FormComponents/GRPCRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const GRPC_FIELDS: GRPCRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.grpc.ipVersion`,
  },
  service: {
    name: `settings.grpc.service`,
  },
  useTLS: {
    name: `settings.grpc.tls`,
  },
  tlsServerName: {
    name: `settings.grpc.tlsConfig.serverName`,
  },
  tlsInsecureSkipVerify: {
    name: `settings.grpc.tlsConfig.insecureSkipVerify`,
  },
  tlsCaSCert: {
    name: `settings.grpc.tlsConfig.caCert`,
  },
  tlsClientCert: {
    name: `settings.grpc.tlsConfig.clientCert`,
  },
  tlsClientKey: {
    name: `settings.grpc.tlsConfig.clientKey`,
  },
};

export const GRPCCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesGRPC>>> = {
  [LayoutSection.Check]: {
    fields: [`target`],
    Component: (
      <>
        <GRPCRequest fields={GRPC_FIELDS} />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <>
        <Timeout checkType={CheckType.GRPC} />
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
