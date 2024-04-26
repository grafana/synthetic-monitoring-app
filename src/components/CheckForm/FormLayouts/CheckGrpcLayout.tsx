import React from 'react';

import { CheckFormTypeLayoutProps, CheckFormValuesGRPC, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { CheckUseTLS } from 'components/CheckEditor/FormComponents/CheckUseTLS';
import { GRPCCheckService } from 'components/CheckEditor/FormComponents/GRPCCheckService';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckGrpcLayout = ({ formActions, onSubmit, onSubmitError, errorMessage }: CheckFormTypeLayoutProps) => {
  return (
    <FormLayout formActions={formActions} onSubmit={onSubmit} onSubmitError={onSubmitError} errorMessage={errorMessage}>
      <FormLayout.Section
        label="General settings"
        fields={['enabled', 'job', 'target', 'probes', 'frequency', 'timeout']}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.GRPC} />
        <ProbeOptions checkType={CheckType.GRPC} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage checkType={CheckType.GRPC} />
      </FormLayout.Section>

      <FormLayout.Section label="gRPC settings" fields={['settings.grpc.service', 'settings.grpc.tls']}>
        <CheckUseTLS checkType={CheckType.GRPC} />
        <GRPCCheckService />
      </FormLayout.Section>

      <FormLayout.Section label="TLS config" fields={[`settings.grpc.tlsConfig`]}>
        <TLSConfig checkType={CheckType.GRPC} />
      </FormLayout.Section>

      <FormLayout.Section label="Advanced options" fields={['labels', 'settings.grpc.ipVersion']}>
        <LabelField<CheckFormValuesGRPC> labelDestination="check" />
        <CheckIpVersion checkType={CheckType.GRPC} name="settings.grpc.ipVersion" />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
