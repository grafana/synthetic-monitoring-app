import React, { useState } from 'react';

import { CheckFormValuesScripted, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckScriptedLayout = () => {
  const [showGeneralSettings, setShowGeneralSettings] = useState(true);
  const [showScript, setShowScript] = useState(false);

  return (
    <>
      <Collapse
        label="General settings"
        onToggle={() => setShowGeneralSettings(!showGeneralSettings)}
        isOpen={showGeneralSettings}
      >
        <CheckEnabled />
        <CheckJobName />
        <ScriptedCheckInstance />
        <ProbeOptions checkType={CheckType.MULTI_HTTP} />
        <LabelField<CheckFormValuesScripted> />
      </Collapse>
      <Collapse label="Script" onToggle={() => setShowScript(!showScript)} isOpen={showScript}>
        <ScriptedCheckScript />
      </Collapse>
    </>
  );
};
