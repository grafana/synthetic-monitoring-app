import React from 'react';

import { CheckFormTypeLayoutProps, CheckFormValuesPing, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { CheckUseTLS } from 'components/CheckEditor/FormComponents/CheckUseTLS';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckTCPLayout = ({
  formActions,
  onSubmit,
  onSubmitError,
  errorMessage,
  schema,
}: CheckFormTypeLayoutProps) => {
  return (
    <FormLayout
      formActions={formActions}
      onSubmit={onSubmit}
      onSubmitError={onSubmitError}
      errorMessage={errorMessage}
      schema={schema}
    >
      <FormLayout.Section label="Define check" fields={[`enabled`, `job`, `target`]} required>
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.TCP} />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`, `publishAdvancedMetrics`]} required>
        <CheckUsage checkType={CheckType.TCP} />
        <CheckPublishedAdvanceMetrics />
        <ProbeOptions checkType={CheckType.TCP} />
      </FormLayout.Section>
      <FormLayout.Section label="TCP settings" fields={[`settings.tcp.tls`]}>
        <CheckUseTLS checkType={CheckType.TCP} />
      </FormLayout.Section>
      <FormLayout.Section label="Query/Response" fields={[`settings.tcp.queryResponse`]}>
        <TCPCheckQueryAndResponse />
      </FormLayout.Section>
      <FormLayout.Section label="TLS config" fields={[`settings.tcp.tlsConfig`]}>
        <TLSConfig checkType={CheckType.TCP} />
      </FormLayout.Section>
      <FormLayout.Section label="Advanced options" fields={[`labels`, `settings.tcp.ipVersion`]}>
        <LabelField<CheckFormValuesPing> labelDestination="check" />
        <CheckIpVersion checkType={CheckType.TCP} name="settings.tcp.ipVersion" />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
