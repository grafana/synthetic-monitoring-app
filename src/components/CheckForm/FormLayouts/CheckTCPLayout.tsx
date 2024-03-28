import React from 'react';

import { CheckFormValuesPing, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { TCPCheckQueryAndResponse } from 'components/CheckEditor/FormComponents/TCPCheckQueryAndResponse';
import { TCPCheckUseTLS } from 'components/CheckEditor/FormComponents/TCPCheckUseTLS';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';
import { TLSConfig } from 'components/TLSConfig';

export const CheckTCPLayout = () => {
  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`, `publishAdvancedMetrics`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.TCP} />
        <ProbeOptions checkType={CheckType.TCP} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </FormLayout.Section>
      <FormLayout.Section label="TCP settings" fields={[`settings.tcp.tls`]}>
        <TCPCheckUseTLS />
      </FormLayout.Section>
      <FormLayout.Section label="Query/Response" fields={[`settings.tcp.queryResponse`]}>
        <TCPCheckQueryAndResponse />
      </FormLayout.Section>
      <FormLayout.Section label="TLS config" fields={[`settings.tcp.tlsConfig`]}>
        <TLSConfig checkType={CheckType.TCP} />
      </FormLayout.Section>
      <FormLayout.Section label="Advanced options" fields={[`labels`, `settings.dns.ipVersion`]}>
        <LabelField<CheckFormValuesPing> />
        <CheckIpVersion checkType={CheckType.DNS} name="settings.dns.ipVersion" />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
