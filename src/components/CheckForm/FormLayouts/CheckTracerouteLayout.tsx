import React from 'react';

import { CheckFormTypeLayoutProps, CheckFormValuesTraceroute, CheckType } from 'types';
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

export const CheckTracerouteLayout = ({
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
        <CheckTarget checkType={CheckType.Traceroute} />
      </FormLayout.Section>
      <FormLayout.Section label="Probes" fields={[`probes`, `frequency`, `timeout`]} required>
        <CheckUsage checkType={CheckType.Traceroute} />
        <CheckPublishedAdvanceMetrics />
        <ProbeOptions checkType={CheckType.Traceroute} />
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
        <LabelField<CheckFormValuesTraceroute> labelDestination="check" />
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
