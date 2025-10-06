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
  label?: string;
  scriptField?: `settings.${CheckType.Scripted | CheckType.Browser}.script`;
  examples?: ExampleScript[];
}

const GRPC_REQUEST_OPTIONS_TAB_FIELDS = [
  undefined, // Options
  [/\.tlsConfig\./], // TSL
];

const GRPC_REQUEST_OPTIONS_FIELDS = GRPC_REQUEST_OPTIONS_TAB_FIELDS.filter((field) => {
  return field !== undefined;
}).flat();

export const SCRIPTED_CHECK_FIELDS = ['job', 'target', ...GRPC_REQUEST_OPTIONS_FIELDS];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckContent({
  label = 'Script',
  examples = SCRIPT_EXAMPLES,
  scriptField = 'settings.scripted.script',
}: ScriptedCheckSectionProps) {
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
