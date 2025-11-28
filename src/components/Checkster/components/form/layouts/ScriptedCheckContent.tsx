import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackNeedHelpScriptsButtonClicked } from 'features/tracking/checkFormEvents';

import { CheckType } from '../../../../../types';
import { K6ChannelSelect } from 'components/CheckEditor/FormComponents/K6ChannelSelect';
import { useChecksterContext } from 'components/Checkster/contexts/ChecksterContext';
import { useFeatureTabsContext } from 'components/Checkster/contexts/FeatureTabsContext';

import { ExampleScript } from '../../../../ScriptExamplesMenu/constants';
import { SCRIPT_EXAMPLES } from '../../../../WelcomeTabs/constants';
import { FIELD_SPACING, SECONDARY_CONTAINER_ID } from '../../../constants';
import { ScriptExamples } from '../../ScriptExamples';
import { Column } from '../../ui/Column';
import { SectionContent } from '../../ui/SectionContent';
import { FormInstanceField } from '../FormInstanceField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { GenericScriptField } from '../generic/GenericScriptField';

interface ScriptedCheckSectionProps {
  scriptField?: `settings.${CheckType.Scripted | CheckType.Browser}.script`;
  channelField?: `settings.${CheckType.Scripted | CheckType.Browser}.channel`;
  examples?: ExampleScript[];
}

export const SCRIPTED_CHECK_FIELDS = ['job', 'target', 'settings.scripted.channel', 'settings.scripted.script'];

// Don't set label here, set it explicitly, where the component is used (for readability)
export function ScriptedCheckContent({
  examples = SCRIPT_EXAMPLES,
  scriptField = 'settings.scripted.script',
  channelField = 'settings.scripted.channel',
}: ScriptedCheckSectionProps) {
  const theme = useTheme2();
  const hasExamples = examples && examples?.length > 0;
  const styles = useStyles2(getStyles);

  return (
    <SectionContent noWrapper>
      <Column gap={FIELD_SPACING} padding={theme.spacing(0, 2)}>
        <FormJobField field="job" />
        <FormInstanceField field="target" />
        <K6ChannelSelect />
      </Column>
      <Column fill>
        <FormTabs actions={<HelpButton />}>
          <FormTabContent label="Script" fillVertical vanilla>
            <GenericScriptField field={scriptField} channelField={channelField} />
          </FormTabContent>
          {hasExamples && (
            <FormTabContent label="Examples" fillVertical vanilla className={styles.codeSnippetWrapper}>
              <ScriptExamples examples={examples} />
            </FormTabContent>
          )}
        </FormTabs>
      </Column>
    </SectionContent>
  );
}

const HelpButton = () => {
  const { setActive } = useFeatureTabsContext();
  const { checkType } = useChecksterContext();
  const source = `${checkType}_check`;

  return (
    <Button
      type="button"
      onClick={() => {
        setActive('Docs', true);
        document.getElementById(SECONDARY_CONTAINER_ID)?.focus();
        trackNeedHelpScriptsButtonClicked({ source });
      }}
      fill="text"
      icon="k6"
      tooltip="Synthetic Monitoring scripts are built on top of Grafana k6. Click to learn more about authoring scripts."
    >
      Need help writing scripts?
    </Button>
  );
};

function getStyles(theme: GrafanaTheme2) {
  return {
    codeSnippetWrapper: css`
      // Handle code snippet border
      & > div,
      & > div > div {
        border: none;
      }

      // Change code snippet menu background
      & section > div > div {
        background-color: ${theme.colors.background.primary};
      }
    `,
  };
}
