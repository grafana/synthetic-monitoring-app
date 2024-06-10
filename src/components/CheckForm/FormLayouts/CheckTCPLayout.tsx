import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTcp, CheckType } from 'types';
import { TCPRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { TCPRequest } from 'components/CheckEditor/FormComponents/TCPRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

const TCP_FIELDS: TCPRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.tcp.ipVersion`,
  },
  useTLS: {
    name: `settings.tcp.tls`,
  },
  tlsServerName: {
    name: `settings.tcp.tlsConfig.serverName`,
  },
  tlsInsecureSkipVerify: {
    name: `settings.tcp.tlsConfig.insecureSkipVerify`,
  },
  tlsCaSCert: {
    name: `settings.tcp.tlsConfig.caCert`,
  },
  tlsClientCert: {
    name: `settings.tcp.tlsConfig.clientCert`,
  },
  tlsClientKey: {
    name: `settings.tcp.tlsConfig.clientKey`,
  },
};

export const TCPCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesTcp>>> = {
  [LayoutSection.Check]: {
    fields: [`target`],
    Component: (
      <>
        <TCPRequest fields={TCP_FIELDS} />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`settings.tcp.queryResponse`, `timeout`],
    Component: (
      <>
        <TCPCheckQueryAndResponse />
        <Timeout checkType={CheckType.TCP} />
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
