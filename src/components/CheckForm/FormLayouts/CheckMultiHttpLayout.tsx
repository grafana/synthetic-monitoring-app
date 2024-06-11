import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesMultiHttp, CheckType } from 'types';
import { MultiHttpAssertions } from 'components/CheckEditor/FormComponents/MultiHttpAssertions';
import { MultiHttpCheckRequests } from 'components/CheckEditor/FormComponents/MultiHttpCheckRequests';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

import { ENTRY_INDEX_CHAR } from '../FormLayout/formlayout.utils';

export const MultiHTTPCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesMultiHttp>>> = {
  [LayoutSection.Check]: {
    fields: [`settings.multihttp.entries.${ENTRY_INDEX_CHAR}.request`],
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
        <Timeout checkType={CheckType.MULTI_HTTP} />
      </>
    ),
  },
};
