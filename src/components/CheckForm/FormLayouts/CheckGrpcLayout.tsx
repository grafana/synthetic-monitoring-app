import React, { useCallback } from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesGRPC, CheckType } from 'types';
import { GRPCRequestFields } from 'components/CheckEditor/CheckEditor.types';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { GRPCRequest } from 'components/CheckEditor/FormComponents/GRPCRequest';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { useCheckFormContext } from '../CheckFormContext/CheckFormContext';

export const GRPC_REQUEST_FIELDS: GRPCRequestFields = {
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

const CheckGRPCRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;

  const onTest = useCallback(() => {
    addRequest(GRPC_REQUEST_FIELDS);
  }, [addRequest]);

  return <GRPCRequest disabled={isFormDisabled} fields={GRPC_REQUEST_FIELDS} onTest={onTest} />;
};

export const GRPCCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesGRPC>>> = {
  [LayoutSection.Check]: {
    fields: [`target`],
    Component: (
      <>
        <CheckGRPCRequest />
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
