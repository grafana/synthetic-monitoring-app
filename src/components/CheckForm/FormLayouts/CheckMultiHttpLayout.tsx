import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const MultiHTTPCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesMultiHttp>>> = {
  [LayoutSection.Check]: {
    fields: [`settings.multihttp.entries`],
    Component: (
      <>
        <MultiHttpCheckRequests />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`],
    Component: (
      <>
        <Timeout checkType={CheckType.MULTI_HTTP} />
      </>
    ),
  },
};
