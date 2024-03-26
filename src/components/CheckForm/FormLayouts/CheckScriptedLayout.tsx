import React from 'react';

import { CheckFormValuesScripted, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckScriptedLayout = () => {
  return (
    <>
      <Collapse label="General settings" isOpen>
        <CheckEnabled />
        <CheckJobName />
        <ScriptedCheckInstance />
        <ProbeOptions checkType={CheckType.Scripted} />
        <LabelField<CheckFormValuesScripted> />
      </Collapse>
      <Collapse label="Script">
        <ScriptedCheckScript />
      </Collapse>
      <Collapse label="Alerting">
        <CheckFormAlert />
      </Collapse>
    </>
  );
};
