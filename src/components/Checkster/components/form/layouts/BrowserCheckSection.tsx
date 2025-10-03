import React from 'react';
import { useTheme2 } from '@grafana/ui';

import { ExampleScript } from 'components/ScriptExamplesMenu/constants';
import { BROWSER_EXAMPLES } from 'components/WelcomeTabs/constants';

import { FIELD_SPACING } from '../../../constants';
import { codeSnippetWrapper } from '../../../styles';
import { ScriptExamples } from '../../ScriptExamples';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormInstanceField } from '../FormInstanceField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericScriptField } from '../generic/GenericScriptField';

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckSection({ label, examples }: { label: string; examples?: ExampleScript[] }) {
  const theme = useTheme2();
  const hasExamples = examples && examples?.length > 0;

  return (
    <SectionContent label={label} vanilla>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <FormInstanceField field="target" />
      </Column>
      <Column fill>
        <FormTabs>
          <FormTabContent label="Script" fillVertical vanilla>
            <GenericScriptField field="settings.scripted.script" />
          </FormTabContent>
          {hasExamples && (
            <FormTabContent label="Examples" fillVertical className={codeSnippetWrapper}>
              <ScriptExamples examples={BROWSER_EXAMPLES} />
            </FormTabContent>
          )}
        </FormTabs>
      </Column>
    </SectionContent>
  );
}
