import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTheme2 } from '@grafana/ui';

import { CheckFormValues, CheckType, K6Channel } from '../../../../../types';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { SCRIPT_EXAMPLES } from '../../../../WelcomeTabs/constants';
import { FIELD_SPACING } from '../../../constants';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormFolderField } from '../FormFolderField';
import { FormInstanceField } from '../FormInstanceField';
import { FormJobField } from '../FormJobField';
import { GenericScriptField } from '../generic/GenericScriptField';

interface ScriptedCheckSectionProps {
  scriptField?: `settings.${CheckType.Scripted | CheckType.Browser}.script`;
  examples?: ExampleScript[];
  scriptDescription?: string;
}

export const SCRIPTED_CHECK_FIELDS = ['job', 'target', 'folderUid', 'channels.k6', 'settings.scripted.script'];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckContent({
  examples = SCRIPT_EXAMPLES,
  scriptField = 'settings.scripted.script',
  scriptDescription = 'Define the requests and assertions to run, using Grafana k6.',
}: ScriptedCheckSectionProps) {
  const theme = useTheme2();
  const { control } = useFormContext<CheckFormValues>();
  const k6Channel = useWatch({ control, name: 'channels.k6' }) as K6Channel | undefined;
  const isDeprecatedChannel = !!k6Channel && new Date(k6Channel.deprecatedAfter) < new Date();

  return (
    <SectionContent noWrapper>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <FormInstanceField field="target" />
        <FormFolderField />
      </Column>
      <Column fill padding={theme.spacing(0, 2)}>
        <GenericScriptField
          field={scriptField}
          examples={examples}
          description={scriptDescription}
          runtimeChannelId={k6Channel?.id}
          warningMessage={
            isDeprecatedChannel ? 'This k6 version is no longer supported. Switch to a supported channel.' : undefined
          }
        />
      </Column>
    </SectionContent>
  );
}
