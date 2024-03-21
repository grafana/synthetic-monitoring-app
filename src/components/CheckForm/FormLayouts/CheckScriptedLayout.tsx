import React from 'react';

import { CheckFormValuesScripted, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { FormLayout } from 'components/CheckForm/FormLayout/FormLayout';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { LabelField } from 'components/LabelField';

export const CheckScriptedLayout = () => {
  return (
    <FormLayout>
      <FormLayout.Section
        label="General settings"
        fields={[`enabled`, `job`, `target`, `probes`, `frequency`, `timeout`]}
      >
        <CheckEnabled />
        <CheckJobName />
        <ScriptedCheckInstance />
        <ProbeOptions checkType={CheckType.Scripted} />
        <LabelField<CheckFormValuesScripted> />
      </FormLayout.Section>
      <FormLayout.Section label="Script" fields={[`settings.scripted.script`]}>
        <ScriptedCheckScript />
      </FormLayout.Section>
      <FormLayout.Section label="Alerting" fields={[`alertSensitivity`]}>
        <CheckFormAlert />
      </FormLayout.Section>
    </FormLayout>
  );
};
