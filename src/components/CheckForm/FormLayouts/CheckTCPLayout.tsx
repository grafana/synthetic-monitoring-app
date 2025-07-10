import React from 'react';
import { useFormContext } from 'react-hook-form';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesTcp, CheckType } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
import { TCPRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { TCPRequest } from 'components/CheckEditor/FormComponents/TCPRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

const TCP_REQUEST_FIELDS: TCPRequestFields = {
  target: {
    name: `target`,
  },
  ipVersion: {
    name: `settings.tcp.ipVersion`,
    section: 0,
  },
  useTLS: {
    name: `settings.tcp.tls`,
    section: 1,
  },
  tlsServerName: {
    name: `settings.tcp.tlsConfig.serverName`,
    section: 1,
  },
  tlsInsecureSkipVerify: {
    name: `settings.tcp.tlsConfig.insecureSkipVerify`,
    section: 1,
  },
  tlsCaSCert: {
    name: `settings.tcp.tlsConfig.caCert`,
    section: 1,
  },
  tlsClientCert: {
    name: `settings.tcp.tlsConfig.clientCert`,
    section: 1,
  },
  tlsClientKey: {
    name: `settings.tcp.tlsConfig.clientKey`,
    section: 1,
  },
};

const CheckTCPRequest = () => {
  const { handleErrorRef } = useNestedRequestErrors(TCP_REQUEST_FIELDS);
  const {
    formState: { disabled: isFormDisabled },
  } = useFormContext();

  return <TCPRequest disabled={isFormDisabled} fields={TCP_REQUEST_FIELDS} ref={handleErrorRef} />;
};

export const TCPCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesTcp>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(TCP_REQUEST_FIELDS).map((field) => field.name),
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
