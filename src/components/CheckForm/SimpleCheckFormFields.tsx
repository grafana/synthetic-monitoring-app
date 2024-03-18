import React from 'react';

import { CheckType } from 'types';
import { CheckSettings } from 'components/CheckEditor/CheckSettings';
import { CheckPublishedAdvanceMetrics } from 'components/CheckEditor/FormComponents/CheckPublishedAdvanceMetrics';
import { CheckTarget } from 'components/CheckEditor/FormComponents/CheckTarget';
import { ProbeOptions } from 'components/CheckEditor/ProbeOptions';
import { CheckUsage } from 'components/CheckUsage';

export const SimpleCheckFormFields = ({ checkType }: { checkType: CheckType }) => {
  return (
    <>
      <CheckTarget checkType={checkType} />
      <ProbeOptions checkType={checkType} />
      <CheckPublishedAdvanceMetrics />
      <CheckUsage />
      <CheckSettings typeOfCheck={checkType} />
    </>
  );
};
