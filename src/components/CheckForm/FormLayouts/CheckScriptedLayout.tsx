import React from 'react';
import { Stack, TextLink } from '@grafana/ui';

import { LayoutSection, Section } from './Layout.types';
import { CheckFormValuesScripted, CheckType } from 'types';
import { ScriptedFields } from 'components/CheckEditor/CheckEditor.types';
import { ScriptedCheckInstance } from 'components/CheckEditor/FormComponents/ScriptedCheckInstance';
import { ScriptedCheckScript } from 'components/CheckEditor/FormComponents/ScriptedCheckScript';
import { Timeout } from 'components/CheckEditor/FormComponents/Timeout';

export const SCRIPTED_CHECK_FIELDS: ScriptedFields = {
  script: {
    name: `settings.scripted.script`,
  },
  target: {
    name: `target`,
  },
};

export const ScriptedCheckLayout: Partial<Record<LayoutSection, Section<CheckFormValuesScripted>>> = {
  [LayoutSection.Check]: {
    fields: Object.values(SCRIPTED_CHECK_FIELDS).map((field) => field.name),
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
      <Stack direction={`column`} gap={4}>
        <div>
          Include uptime checks and assertions in your script. See the docs about {` `}
          <TextLink href={`https://grafana.com/docs/k6/latest/javascript-api/k6/check/`} external>
            running checks in a k6 script.
          </TextLink>
        </div>
        <Timeout checkType={CheckType.Scripted} />
      </Stack>
    ),
  },
};
