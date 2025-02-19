import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { MultiHttpAssertions } from 'components/CheckEditor/FormComponents/MultiHttpAssertions';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { CheckTimeoutValues } from '../CheckForm.constants';
import { ENTRY_INDEX_CHAR } from '../FormLayout/formlayout.utils';

export const MultiHTTPCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesMultiHttp>>> = {
  [LayoutSection.Check]: {
    fields: [
      `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request`,
      `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.variables`,
    ],
    Component: (
      <>
        <MultiHttpCheckRequests />
      </>
    ),
  },
  [LayoutSection.Uptime]: {
    fields: [`timeout`, `settings.multihttp.entries.${ENTRY_INDEX_CHAR}.checks`],
    Component: (
      <>
        <MultiHttpAssertions />
        <Timeout
          min={CheckTimeoutValues[CheckType.MULTI_HTTP].min}
          max={CheckTimeoutValues[CheckType.MULTI_HTTP].max}
        />
      </>
    ),
  },
};
