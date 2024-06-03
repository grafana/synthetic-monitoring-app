import React from 'react';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesScripted, CheckType } from 'types';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const ScriptedCheckLayout: Record<LayoutSection, Array<Section<CheckFormValuesScripted>>> = {
  [LayoutSection.Check]: [
    {
      label: ``,
      fields: [`settings.scripted.script`],
      Component: (
        <>
          <ScriptedCheckScript />
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
  [LayoutSection.Labels]: [
    {
      label: ``,
      fields: [`target`],
      Component: (
        <>
          <ScriptedCheckInstance />
        </>
      ),
    },
  ],
  [LayoutSection.Alerting]: [],
  [LayoutSection.Review]: [],
};
