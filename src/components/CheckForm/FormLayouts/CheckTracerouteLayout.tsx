import React from 'react';

import { CheckFormValuesTraceroute, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { TracerouteMaxHops } from 'components/CheckEditor/FormComponents/TracerouteMaxHops';
import { TracerouteMaxUnknownHops } from 'components/CheckEditor/FormComponents/TracerouteMaxUnknownHops';
import { TraceroutePTRLookup } from 'components/CheckEditor/FormComponents/TraceroutePTRLookup';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { CheckUsage } from 'components/CheckUsage';
import { LabelField } from 'components/LabelField';

export const CheckTracerouteLayout = () => {
  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <CheckTarget checkType={CheckType.Traceroute} />
        <ProbeOptions checkType={CheckType.Traceroute} />
        <CheckPublishedAdvanceMetrics />
        <CheckUsage />
      </FormLayout.Section>
      <FormLayout.Section
        label="Advanced options"
        fields={[
          `labels`,
          `settings.traceroute.maxHops`,
          `settings.traceroute.maxUnknownHops`,
          `settings.traceroute.ptrLookup`,
        ]}
      >
        <LabelField<CheckFormValuesTraceroute> />
        <TracerouteMaxHops />
        <TracerouteMaxUnknownHops />
        <TraceroutePTRLookup />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
