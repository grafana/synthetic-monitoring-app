import React, { useCallback } from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTcp } from 'types';
import { TCPRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { TCPRequest } from 'components/CheckEditor/FormComponents/TCPRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

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

const CheckTCPRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;

  const onTest = useCallback(() => {
    addRequest(TCP_FIELDS);
  }, [addRequest]);

  return <TCPRequest disabled={isFormDisabled} fields={TCP_FIELDS} onTest={onTest} />;
};

export const TCPCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesTcp>>> = {
  [LayoutSection.Check]: {
    fields: [`target`],
    Component: (
      <>
        <CheckTCPRequest />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`settings.tcp.queryResponse`, `timeout`],
    Component: (
      <>
        <TCPCheckQueryAndResponse />
        <Timeout />
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
