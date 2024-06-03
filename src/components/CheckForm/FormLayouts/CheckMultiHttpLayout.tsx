import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const MultiHTTPCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesMultiHttp>>> = {
  [LayoutSection.Check]: [
    {
      label: ``,
      fields: [`settings.multihttp.entries`],
      Component: (
        <>
          <MultiHttpCheckRequests />
        </>
      ),
    },
  ],
  [LayoutSection.Uptime]: [
    {
      label: ``,
      fields: [`timeout`],
      Component: (
        <>
          <Timeout checkType={CheckType.MULTI_HTTP} />
        </>
      ),
    },
  ],
  [LayoutSection.Probes]: [],
  [LayoutSection.Labels]: [],
  [LayoutSection.Alerting]: [],
  [LayoutSection.Review]: [],
};
