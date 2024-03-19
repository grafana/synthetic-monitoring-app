import React, { useState } from 'react';

import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckMultiHTTPLayout = () => {
  const [showGeneralSettings, setShowGeneralSettings] = useState(true);
  const [showHttpSettings, setShowHttpSettings] = useState(false);

  return (
    <>
      <Collapse
        label="General settings"
        onToggle={() => setShowGeneralSettings(!showGeneralSettings)}
        isOpen={showGeneralSettings}
      >
        <CheckEnabled />
        <CheckJobName />
        <ProbeOptions checkType={CheckType.MULTI_HTTP} />
        <LabelField<CheckFormValuesMultiHttp> />
      </Collapse>
      <Collapse label="Requests" onToggle={() => setShowHttpSettings(!showHttpSettings)} isOpen={showHttpSettings}>
        <div>At least one target HTTP is required; limit 10 requests per check.</div>
        <MultiHttpCheckRequests />
      </Collapse>
    </>
  );
};
