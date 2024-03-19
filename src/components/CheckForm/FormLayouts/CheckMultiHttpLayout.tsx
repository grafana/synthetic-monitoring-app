import React from 'react';

import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { CheckEnabled } from 'components/CheckEditor/FormComponents/CheckEnabled';
import { CheckJobName } from 'components/CheckEditor/FormComponents/CheckJobName';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckFormAlert } from 'components/CheckFormAlert';
import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

export const CheckMultiHTTPLayout = () => {
  return (
    <>
      <Collapse label="General settings" isOpen>
        <CheckEnabled />
        <CheckJobName />
        <ProbeOptions checkType={CheckType.MULTI_HTTP} />
        <LabelField<CheckFormValuesMultiHttp> />
      </Collapse>
      <Collapse label="Requests">
        <div>At least one target HTTP is required; limit 10 requests per check.</div>
        <MultiHttpCheckRequests />
      </Collapse>
      <Collapse label="Alerting">
        <CheckFormAlert />
      </Collapse>
    </>
  );
};
