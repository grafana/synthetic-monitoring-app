import React from 'react';

import { CheckFormTypeLayoutProps, CheckFormValuesPing, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckIpVersion } from 'components/CheckEditor/FormComponents/CheckIpVersion';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { PingCheckFragment } from 'components/CheckEditor/FormComponents/PingCheckFragment';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckPingLayout = ({ formActions }: CheckFormTypeLayoutProps) => {
  return (
    <FormLayout formActions={formActions}>
      <FormLayout.Section label="Define check" fields={[`enabled`, `job`, `target`]} required>
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.PING} />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`]} required>
        <CheckUsage />
        <CheckPublishedAdvanceMetrics />
        <ProbeOptions checkType={CheckType.PING} />
      </FormLayout.Section>
      <FormLayout.Section
        label="Advanced options"
        fields={[`labels`, `settings.ping.ipVersion`, `settings.ping.dontFragment`]}
      >
        <LabelField<CheckFormValuesPing> labelDestination="check" />
        <CheckIpVersion checkType={CheckType.PING} name="settings.ping.ipVersion" />
        <PingCheckFragment />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
