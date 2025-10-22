import React from 'react';
import { useTheme2 } from '@grafana/ui';

import { CheckType } from '../../../../../types';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { SCRIPT_EXAMPLES } from '../../../../WelcomeTabs/constants';
import { FIELD_SPACING } from '../../../constants';
import { codeSnippetWrapper } from '../../../styles';
import { ScriptExamples } from '../../ScriptExamples';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormInstanceField } from '../FormInstanceField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericScriptField } from '../generic/GenericScriptField';

interface ScriptedCheckSectionProps {
  scriptField?: `settings.${CheckType.Scripted | CheckType.Browser}.script`;
  examples?: ExampleScript[];
}

export const SCRIPTED_CHECK_FIELDS = ['job', 'target', 'settings.scripted.script'];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckContent({
  examples = SCRIPT_EXAMPLES,
  scriptField = 'settings.scripted.script',
}: ScriptedCheckSectionProps) {
  const theme = useTheme2();
  const hasExamples = examples && examples?.length > 0;

  return (
    <SectionContent noWrapper>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <FormInstanceField field="target" />
      </Column>
      <Column fill>
        <FormTabs>
          <FormTabContent label="Script" fillVertical vanilla>
            <GenericScriptField field={scriptField} />
          </FormTabContent>
          {hasExamples && (
            <FormTabContent label="Examples" fillVertical vanilla className={codeSnippetWrapper(theme)}>
              <ScriptExamples examples={examples} />
            </FormTabContent>
          )}
        </FormTabs>
      </Column>
    </SectionContent>
  );
}
