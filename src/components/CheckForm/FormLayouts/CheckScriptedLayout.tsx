import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesScripted, CheckType } from 'types';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const ScriptedCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesScripted>>> = {
  [LayoutSection.Check]: {
    fields: [`settings.scripted.script`, `target`],
    Component: (
      <>
        <ScriptedCheckInstance />
        <ScriptedCheckScript />
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
