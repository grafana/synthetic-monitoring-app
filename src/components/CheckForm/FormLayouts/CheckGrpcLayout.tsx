import React, { useCallback } from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesGRPC } from 'types';
import { useNestedRequestErrors } from 'hooks/useNestedRequestErrors';
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
    section: 0,
  },
  service: {
    name: `settings.grpc.service`,
    section: 1,
  },
  useTLS: {
    name: `settings.grpc.tls`,
    section: 2,
  },
  tlsServerName: {
    name: `settings.grpc.tlsConfig.serverName`,
    section: 2,
  },
  tlsInsecureSkipVerify: {
    name: `settings.grpc.tlsConfig.insecureSkipVerify`,
    section: 2,
  },
  tlsCaSCert: {
    name: `settings.grpc.tlsConfig.caCert`,
    section: 2,
  },
  tlsClientCert: {
    name: `settings.grpc.tlsConfig.clientCert`,
    section: 2,
  },
  tlsClientKey: {
    name: `settings.grpc.tlsConfig.clientKey`,
    section: 2,
  },
};

const CheckGRPCRequest = () => {
  const { isFormDisabled, supportingContent } = useCheckFormContext();
  const { addRequest } = supportingContent;
  const { handleErrorRef } = useNestedRequestErrors(GRPC_REQUEST_FIELDS);

  const onTest = useCallback(() => {
    addRequest(GRPC_REQUEST_FIELDS);
  }, [addRequest]);

  return <GRPCRequest disabled={isFormDisabled} fields={GRPC_REQUEST_FIELDS} onTest={onTest} ref={handleErrorRef} />;
};

export const GRPCCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesGRPC>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(GRPC_REQUEST_FIELDS).map((field) => field.name),
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
