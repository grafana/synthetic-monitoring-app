import React from 'react';

import { CheckFormTypeLayoutProps, CheckFormValuesPing, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { DNSCheckRecordPort } from 'components/CheckEditor/FormComponents/DNSCheckRecordPort';
import { DNSCheckRecordProtocol } from 'components/CheckEditor/FormComponents/DNSCheckRecordProtocol';
import { DNSCheckRecordServer } from 'components/CheckEditor/FormComponents/DNSCheckRecordServer';
import { DNSCheckRecordType } from 'components/CheckEditor/FormComponents/DNSCheckRecordType';
import { DNSCheckResponseMatches } from 'components/CheckEditor/FormComponents/DNSCheckResponseMatches';
import { DNSCheckValidResponseCodes } from 'components/CheckEditor/FormComponents/DNSCheckValidResponseCodes';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckDNSLayout = ({ formActions, onSubmit, onSubmitError }: CheckFormTypeLayoutProps) => {
  return (
    <FormLayout formActions={formActions} onSubmit={onSubmit} onSubmitError={onSubmitError}>
      <FormLayout.Section label="Define check" fields={[`enabled`, `job`, `target`]} required>
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.DNS} />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`]}>
        <CheckUsage />
        <CheckPublishedAdvanceMetrics />
        <ProbeOptions checkType={CheckType.DNS} />
      </FormLayout.Section>
      <FormLayout.Section
        label="DNS settings"
        fields={[`settings.dns.recordType`, `settings.dns.server`, `settings.dns.protocol`, `settings.dns.port`]}
      >
        <DNSCheckRecordType />
        <DNSCheckRecordServer />
        <DNSCheckRecordProtocol />
        <DNSCheckRecordPort />
      </FormLayout.Section>
      <FormLayout.Section label="Validation" fields={[`settings.dns.validRCodes`, `settings.dns.validations`]}>
        <DNSCheckValidResponseCodes />
        <DNSCheckResponseMatches />
      </FormLayout.Section>
      <FormLayout.Section label="Advanced options" fields={[`labels`, `settings.dns.ipVersion`]}>
        <LabelField<CheckFormValuesPing> labelDestination="check" />
        <CheckIpVersion checkType={CheckType.DNS} name="settings.dns.ipVersion" />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
